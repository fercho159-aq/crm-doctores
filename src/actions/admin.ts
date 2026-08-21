"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { hashPassword, revokeSessions } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { ActionState } from "./auth";

// ── Especialidades ──────────────────────────────────────────────

const especialidadSchema = z.object({
  nombre: z.string().min(3, "Nombre muy corto"),
  descripcion: z.string().optional(),
});

export async function crearEspecialidad(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("ADMIN");
  const parsed = especialidadSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const esp = await db.especialidad.create({ data: parsed.data });
  await audit({ usuarioId: user.id, rol: user.rol, accion: "CREAR", entidad: "especialidad", entidadId: esp.id, datosDespues: parsed.data });
  revalidatePath("/admin/especialidades");
  return { ok: true };
}

export async function toggleEspecialidad(id: string) {
  const user = await requireRole("ADMIN");
  const esp = await db.especialidad.findUniqueOrThrow({ where: { id } });
  await db.especialidad.update({ where: { id }, data: { activa: !esp.activa } });
  await audit({ usuarioId: user.id, rol: user.rol, accion: esp.activa ? "DESACTIVAR" : "ACTIVAR", entidad: "especialidad", entidadId: id });
  revalidatePath("/admin/especialidades");
}

// ── Doctores ──────────────────────────────────────────────

const doctorSchema = z.object({
  nombreCompleto: z.string().min(5, "Nombre completo requerido"),
  email: z.string().email("Correo inválido"),
  cedulaProfesional: z.string().min(4, "Cédula profesional obligatoria (NOM-004)"),
  cedulaEspecialidad: z.string().optional(),
  institucionTitulo: z.string().min(3, "Institución del título obligatoria (aparece en la receta)"),
  universidadEspecialidad: z.string().optional(),
  consultorio: z.string().optional(),
  telefono: z.string().optional(),
  passwordTemporal: z.string().min(10, "Contraseña temporal: mínimo 10 caracteres"),
});

export async function crearDoctor(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("ADMIN");
  const especialidadIds = fd.getAll("especialidadIds").map(String).filter(Boolean);
  const parsed = doctorSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (especialidadIds.length === 0) return { error: "Seleccione al menos una especialidad" };
  const d = parsed.data;

  const existe = await db.usuario.findUnique({ where: { email: d.email.toLowerCase() } });
  if (existe) return { error: "Ya existe un usuario con ese correo" };

  const doctor = await db.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        workspaceId: user.workspaceId,
        rol: "DOCTOR",
        email: d.email.toLowerCase(),
        passwordHash: await hashPassword(d.passwordTemporal),
        nombreCompleto: d.nombreCompleto,
        debeCambiarPassword: true,
      },
    });
    return tx.doctor.create({
      data: {
        usuarioId: usuario.id,
        cedulaProfesional: d.cedulaProfesional,
        cedulaEspecialidad: d.cedulaEspecialidad || null,
        institucionTitulo: d.institucionTitulo,
        universidadEspecialidad: d.universidadEspecialidad || null,
        consultorio: d.consultorio || null,
        telefono: d.telefono || null,
        especialidades: { create: especialidadIds.map((especialidadId) => ({ especialidadId })) },
      },
    });
  });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "CREAR", entidad: "doctor", entidadId: doctor.id,
    datosDespues: { nombre: d.nombreCompleto, email: d.email, cedula: d.cedulaProfesional },
  });
  revalidatePath("/admin/doctores");
  return { ok: true };
}

const firmaSchema = z.object({ doctorId: z.string().uuid(), firma: z.string().startsWith("data:image/") });

export async function guardarFirmaDoctor(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("ADMIN");
  const parsed = firmaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Imagen de firma inválida" };
  if (parsed.data.firma.length > 500_000) return { error: "Imagen demasiado grande (máx ~350 KB)" };
  const doctor = await db.doctor.findUnique({ where: { id: parsed.data.doctorId }, include: { usuario: true } });
  if (!doctor || doctor.usuario.workspaceId !== user.workspaceId) return { error: "Doctor no encontrado." };
  await db.doctor.update({ where: { id: parsed.data.doctorId }, data: { firmaDigitalizada: parsed.data.firma } });
  await audit({ usuarioId: user.id, rol: user.rol, accion: "ACTUALIZAR", entidad: "doctor", entidadId: parsed.data.doctorId, datosDespues: { firma: "actualizada" } });
  revalidatePath("/admin/doctores");
  return { ok: true };
}

// ── Enfermería ──────────────────────────────────────────────

const enfermeriaSchema = z.object({
  nombreCompleto: z.string().min(5, "Nombre completo requerido"),
  email: z.string().email("Correo inválido"),
  passwordTemporal: z.string().min(10, "Contraseña temporal: mínimo 10 caracteres"),
});

export async function crearEnfermeria(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("ADMIN");
  const parsed = enfermeriaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const existe = await db.usuario.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existe) return { error: "Ya existe un usuario con ese correo" };
  const u = await db.usuario.create({
    data: {
      workspaceId: user.workspaceId,
      rol: "ENFERMERIA",
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.passwordTemporal),
      nombreCompleto: parsed.data.nombreCompleto,
      debeCambiarPassword: true,
    },
  });
  await audit({ usuarioId: user.id, rol: user.rol, accion: "CREAR", entidad: "usuario", entidadId: u.id, datosDespues: { rol: "ENFERMERIA", email: u.email } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

// ── Anestesiología ──────────────────────────────────────────────

const anestesiologoSchema = z.object({
  nombreCompleto: z.string().min(5, "Nombre completo requerido"),
  email: z.string().email("Correo inválido"),
  cedulaProfesional: z.string().min(4, "Cédula profesional obligatoria: se imprime en las hojas de anestesiología"),
  cedulaEspecialidad: z.string().optional(),
  institucionTitulo: z.string().min(3, "Institución del título obligatoria"),
  telefono: z.string().optional(),
  passwordTemporal: z.string().min(10, "Contraseña temporal: mínimo 10 caracteres"),
});

export async function crearAnestesiologo(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("ADMIN");
  const parsed = anestesiologoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const existe = await db.usuario.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existe) return { error: "Ya existe un usuario con ese correo" };
  const d = parsed.data;
  // La ficha de Doctor guarda la cédula y la rúbrica que salen impresas en la
  // valoración preanestésica, el registro anestésico y la nota post-anestésica.
  const u = await db.usuario.create({
    data: {
      workspaceId: user.workspaceId,
      rol: "ANESTESIOLOGO",
      email: d.email.toLowerCase(),
      passwordHash: await hashPassword(d.passwordTemporal),
      nombreCompleto: d.nombreCompleto,
      debeCambiarPassword: true,
      doctor: {
        create: {
          cedulaProfesional: d.cedulaProfesional,
          cedulaEspecialidad: d.cedulaEspecialidad || null,
          institucionTitulo: d.institucionTitulo,
          consultorio: "Anestesiología",
          telefono: d.telefono || null,
        },
      },
    },
  });
  await audit({ usuarioId: user.id, rol: user.rol, accion: "CREAR", entidad: "usuario", entidadId: u.id, datosDespues: { rol: "ANESTESIOLOGO", email: u.email, cedula: d.cedulaProfesional } });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

// ── Usuarios: activar/desactivar, reset password ──────────────────────────────

export async function toggleUsuario(usuarioId: string) {
  const admin = await requireRole("ADMIN");
  if (usuarioId === admin.id) return;
  const u = await db.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
  if (u.workspaceId !== admin.workspaceId) return;
  await db.usuario.update({ where: { id: usuarioId }, data: { activo: !u.activo } });
  if (u.activo) await revokeSessions(usuarioId); // baja = revocar sesiones
  await audit({ usuarioId: admin.id, rol: admin.rol, accion: u.activo ? "DESACTIVAR" : "ACTIVAR", entidad: "usuario", entidadId: usuarioId });
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/doctores");
}

const resetSchema = z.object({
  usuarioId: z.string().uuid(),
  passwordTemporal: z.string().min(10, "Mínimo 10 caracteres"),
});

export async function resetPassword(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireRole("ADMIN");
  const parsed = resetSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const objetivo = await db.usuario.findUnique({ where: { id: parsed.data.usuarioId }, select: { workspaceId: true } });
  if (!objetivo || objetivo.workspaceId !== admin.workspaceId) return { error: "Usuario no encontrado." };
  await db.usuario.update({
    where: { id: parsed.data.usuarioId },
    data: { passwordHash: await hashPassword(parsed.data.passwordTemporal), debeCambiarPassword: true, intentosFallidos: 0, bloqueadoHasta: null },
  });
  await revokeSessions(parsed.data.usuarioId);
  await audit({ usuarioId: admin.id, rol: admin.rol, accion: "RESET_PASSWORD", entidad: "usuario", entidadId: parsed.data.usuarioId });
  revalidatePath("/admin/usuarios");
  return { ok: true };
}

// ── Configuración del establecimiento ──────────────────────────────

const vacioANull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const configSchema = z.object({
  razonSocial: z.string().min(3),
  domicilio: z.string().min(5, "Domicilio del establecimiento: obligatorio en recetas (RIS)"),
  telefono: z.string().min(7),
  emailRemitente: z.string().email(),
  // Datos que la papelería oficial imprime en el encabezado de cada formato.
  licenciaSanitaria: z.preprocess(vacioANull, z.string().nullable()),
  rfc: z.preprocess(vacioANull, z.string().nullable()),
  expedienteCofepris: z.preprocess(vacioANull, z.string().nullable()),
  oficioCofepris: z.preprocess(vacioANull, z.string().nullable()),
});

export async function guardarConfiguracion(_p: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireRole("ADMIN");
  const parsed = configSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.configuracion.upsert({ where: { id: 1 }, update: parsed.data, create: { id: 1, ...parsed.data } });
  await audit({ usuarioId: admin.id, rol: admin.rol, accion: "ACTUALIZAR", entidad: "configuracion", entidadId: "1", datosDespues: parsed.data });
  revalidatePath("/admin/configuracion");
  return { ok: true };
}
