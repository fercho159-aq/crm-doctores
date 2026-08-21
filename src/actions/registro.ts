"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { login, hashPassword, getClientIp } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { ActionState } from "./auth";

const LIMITE_REGISTROS_POR_IP = 3;
const VENTANA_HORAS = 1;

// Alta pública de médico independiente (modalidad BASIC): crea su propio workspace,
// no depende de un Administrador. Reutiliza el mismo patrón transaccional que
// `crearDoctor` (admin.ts) y la política de contraseña de cambiar-password.
const registroSchema = z.object({
  nombreCompleto: z.string().min(5, "Nombre completo requerido"),
  email: z.string().email("Correo inválido"),
  password: z
    .string()
    .min(10, "Mínimo 10 caracteres")
    .regex(/[A-Z]/, "Debe incluir mayúscula")
    .regex(/[a-z]/, "Debe incluir minúscula")
    .regex(/[0-9]/, "Debe incluir número"),
  passwordConfirma: z.string(),
  especialidad: z.string().min(3, "Indique su especialidad o el tipo de consulta que ofrece"),
  cedulaProfesional: z.string().min(4, "Cédula profesional obligatoria (NOM-004)"),
  cedulaEspecialidad: z.string().optional(),
  institucionTitulo: z.string().min(3, "Institución del título obligatoria (aparece en la receta)"),
  universidadEspecialidad: z.string().optional(),
  telefono: z.string().optional(),
  domicilioConsultorio: z.string().optional(),
});

export async function registrarDoctorBasic(_p: ActionState, fd: FormData): Promise<ActionState> {
  // Honeypot: campo oculto para personas, invisible en el formulario real;
  // los bots que rellenan todos los <input> lo detonan. Falla en silencio,
  // como si hubiera tenido éxito, para no delatar la defensa.
  if (String(fd.get("sitioWeb") ?? "").trim()) {
    return { ok: true };
  }

  const ip = await getClientIp();
  if (ip) {
    const desde = new Date(Date.now() - VENTANA_HORAS * 3600_000);
    const recientes = await db.bitacora.count({
      where: { accion: "REGISTRO_BASIC", ipOrigen: ip, fechaHora: { gte: desde } },
    });
    if (recientes >= LIMITE_REGISTROS_POR_IP) {
      return { error: "Demasiadas cuentas creadas desde esta conexión. Intente de nuevo más tarde." };
    }
  }

  const parsed = registroSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.password !== d.passwordConfirma) return { error: "Las contraseñas no coinciden." };

  const email = d.email.toLowerCase().trim();
  const existe = await db.usuario.findUnique({ where: { email } });
  if (existe) return { error: "Ya existe una cuenta con ese correo." };

  const { workspace, usuario } = await db.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: { tipo: "BASIC", nombre: `Consultorio — ${d.nombreCompleto}` },
    });
    const usuario = await tx.usuario.create({
      data: {
        workspaceId: workspace.id,
        rol: "DOCTOR",
        email,
        passwordHash: await hashPassword(d.password),
        nombreCompleto: d.nombreCompleto,
        debeCambiarPassword: false, // ya eligió su propia contraseña
      },
    });
    const doctor = await tx.doctor.create({
      data: {
        usuarioId: usuario.id,
        cedulaProfesional: d.cedulaProfesional,
        cedulaEspecialidad: d.cedulaEspecialidad || null,
        institucionTitulo: d.institucionTitulo,
        universidadEspecialidad: d.universidadEspecialidad || null,
        telefono: d.telefono || null,
        domicilioConsultorio: d.domicilioConsultorio || null,
      },
    });
    // Reutiliza el catálogo de especialidades (compartido, sin datos clínicos) en
    // vez de modelar una entidad nueva: Asignacion ya exige especialidadId, y así
    // el doctor BASIC puede autoasignarse pacientes con el mismo mecanismo de CLINIC.
    const especialidad = await tx.especialidad.upsert({
      where: { nombre: d.especialidad.trim() },
      update: {},
      create: { nombre: d.especialidad.trim() },
    });
    await tx.doctorEspecialidad.create({ data: { doctorId: doctor.id, especialidadId: especialidad.id } });
    return { workspace, usuario };
  });

  await audit({
    usuarioId: usuario.id, rol: "DOCTOR", accion: "REGISTRO_BASIC", entidad: "workspace",
    entidadId: workspace.id, datosDespues: { email, nombreCompleto: d.nombreCompleto }, ipOrigen: ip,
  });

  const result = await login(email, d.password);
  if (!result.ok) return { error: "Cuenta creada. Inicie sesión con su correo y contraseña." };
  redirect("/mi-consulta");
}
