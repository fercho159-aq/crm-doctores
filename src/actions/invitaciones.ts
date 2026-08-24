"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes, createHash } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, assertPacienteEnWorkspace, AuthzError } from "@/lib/authz";
import { login, hashPassword, getBaseUrl } from "@/lib/auth";
import { enviarInvitacionPortal } from "@/lib/email";
import { audit } from "@/lib/audit";
import type { ActionState } from "./auth";

const TOKEN_HORAS = 48;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Invitar a un paciente ya existente a crear su cuenta de portal. No es un
// alta de paciente nuevo (eso sigue siendo exclusivo de Enfermería/Doctor en el
// primer llenado); solo habilita el acceso de autoservicio a un expediente que
// ya existe. Enfermería, Doctor y Admin pueden invitar — es una acción
// administrativa (como registrar al paciente), no una lectura del expediente
// clínico, así que se usa assertPacienteEnWorkspace (solo aislamiento por
// workspace) y no assertAccesoPaciente (que exige asignación clínica).
const invitarSchema = z.object({
  email: z.string().email("Correo inválido"),
});

export async function invitarPacienteAlPortal(pacienteId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("ADMIN", "DOCTOR", "ENFERMERIA");
  const parsed = invitarSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const email = parsed.data.email.toLowerCase().trim();

  let paciente;
  try {
    await assertPacienteEnWorkspace(user, pacienteId);
    paciente = await db.paciente.findUniqueOrThrow({ where: { id: pacienteId }, include: { cuentaPortal: true } });
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  if (paciente.cuentaPortal) return { error: "Este paciente ya tiene una cuenta de portal activa." };

  const existeUsuario = await db.usuario.findUnique({ where: { email } });
  if (existeUsuario) return { error: "Ya existe una cuenta (de personal o de otro paciente) con ese correo." };

  const token = randomBytes(32).toString("hex");
  await db.$transaction([
    // Cualquier invitación previa sin usar queda invalidada: solo el enlace más
    // reciente funciona.
    db.invitacionPortal.deleteMany({ where: { pacienteId, usadoEn: null } }),
    db.invitacionPortal.create({
      data: {
        pacienteId,
        email,
        tokenHash: hashToken(token),
        creadoPorId: user.id,
        expiresAt: new Date(Date.now() + TOKEN_HORAS * 3600_000),
      },
    }),
  ]);

  const baseUrl = await getBaseUrl();
  const nombre = `${paciente.nombre} ${paciente.apellidoPaterno}`.trim();
  const envio = await enviarInvitacionPortal(email, nombre, `${baseUrl}/portal/activar/${token}`);

  await audit({
    usuarioId: user.id, rol: user.rol, accion: "INVITAR_PORTAL", entidad: "paciente",
    entidadId: pacienteId, pacienteId, datosDespues: { email, correoEnviado: envio.ok },
  });
  revalidatePath(`/pacientes/${pacienteId}`);
  if (!envio.ok) return { error: `Invitación creada, pero el correo no pudo enviarse (${envio.error}). Puede reintentar.` };
  return { ok: true };
}

// Activación pública: el paciente llega con el token del correo, define su
// contraseña y con eso se crea su Usuario(rol: PACIENTE). Nunca se le pide ni
// se le permite elegir el correo aquí — es el que ya se verificó al invitar.
const activarSchema = z.object({
  token: z.string().min(10),
  password: z
    .string()
    .min(10, "Mínimo 10 caracteres")
    .regex(/[A-Z]/, "Debe incluir mayúscula")
    .regex(/[a-z]/, "Debe incluir minúscula")
    .regex(/[0-9]/, "Debe incluir número"),
  passwordConfirma: z.string(),
});

export async function activarCuentaPaciente(_p: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = activarSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.password !== d.passwordConfirma) return { error: "Las contraseñas no coinciden." };

  const invitacion = await db.invitacionPortal.findUnique({ where: { tokenHash: hashToken(d.token) } });
  if (!invitacion || invitacion.usadoEn || invitacion.expiresAt < new Date()) {
    return { error: "El enlace de invitación no es válido o ya expiró. Solicite uno nuevo a su consultorio." };
  }

  const paciente = await db.paciente.findUnique({
    where: { id: invitacion.pacienteId },
    select: { workspaceId: true, cuentaPortal: true, nombre: true, apellidoPaterno: true, apellidoMaterno: true },
  });
  if (!paciente) return { error: "El expediente asociado a esta invitación ya no existe." };
  if (paciente.cuentaPortal) return { error: "Esta cuenta ya fue activada. Inicie sesión normalmente." };

  const existeUsuario = await db.usuario.findUnique({ where: { email: invitacion.email } });
  if (existeUsuario) return { error: "Ya existe una cuenta con ese correo. Contacte a su consultorio." };

  const nombreCompleto = `${paciente.nombre} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno ?? ""}`.trim();
  const usuario = await db.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        workspaceId: paciente.workspaceId,
        rol: "PACIENTE",
        email: invitacion.email,
        passwordHash: await hashPassword(d.password),
        nombreCompleto,
        debeCambiarPassword: false,
        pacienteId: invitacion.pacienteId,
      },
    });
    await tx.invitacionPortal.update({ where: { id: invitacion.id }, data: { usadoEn: new Date() } });
    return usuario;
  });

  await audit({
    usuarioId: usuario.id, rol: "PACIENTE", accion: "ACTIVAR_PORTAL", entidad: "usuario",
    entidadId: usuario.id, pacienteId: invitacion.pacienteId,
  });

  const result = await login(invitacion.email, d.password);
  if (!result.ok) return { error: "Cuenta activada. Inicie sesión con su correo y contraseña." };
  redirect("/portal");
}
