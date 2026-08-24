import "server-only";
import { redirect } from "next/navigation";
import { getSession, type SessionUser } from "./auth";
import { db } from "./db";
import type { RolClave } from "@prisma/client";

// Capa única de autorización: sesión + rol + propiedad del recurso.
// Toda Server Action y toda página protegida pasa por aquí.

export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: RolClave[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.rol)) redirect("/");
  return user;
}

// Quién puede capturar el primer llenado de un paciente: Enfermería y Admin en
// CLINIC, o el propio Doctor cuando su workspace es BASIC (no tiene enfermería).
export async function requireCapturista(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.rol === "ENFERMERIA" || user.rol === "ADMIN") return user;
  if (user.rol === "DOCTOR" && user.workspaceTipo === "BASIC") return user;
  redirect("/");
}

// Portal del paciente: exige rol PACIENTE y que la cuenta tenga cuenta vinculada.
// El pacienteId sale siempre de la sesión, nunca de params/FormData — así ninguna
// página ni Server Action del portal puede leer/escribir el expediente de otro
// paciente por más que se manipule un id en la URL.
export async function requirePaciente(): Promise<SessionUser & { pacienteId: string }> {
  const user = await requireRole("PACIENTE");
  if (!user.pacienteId) redirect("/login");
  return user as SessionUser & { pacienteId: string };
}

export class AuthzError extends Error {}

export async function assertRole(user: SessionUser, ...roles: RolClave[]) {
  if (!roles.includes(user.rol)) throw new AuthzError("No autorizado para esta acción.");
}

// Doctor solo accede a expedientes de pacientes con asignación ACTIVA suya.
// Admin: lectura global — pero SOLO dentro de su propio workspace (una clínica no
// debe poder leer el expediente de pacientes de un médico independiente ajeno, y
// viceversa). Enfermería: sin acceso a expediente clínico.
export async function assertAccesoPaciente(user: SessionUser, pacienteId: string, opts?: { escritura?: boolean }) {
  const paciente = await db.paciente.findUnique({ where: { id: pacienteId }, select: { workspaceId: true } });
  if (!paciente || paciente.workspaceId !== user.workspaceId) {
    throw new AuthzError("Paciente no encontrado.");
  }
  if (user.rol === "ADMIN") {
    if (opts?.escritura) throw new AuthzError("El administrador solo tiene acceso de lectura al expediente.");
    return;
  }
  if (user.rol !== "DOCTOR" || !user.doctorId) throw new AuthzError("Sin acceso al expediente clínico.");
  const asignacion = await db.asignacion.findFirst({
    where: { pacienteId, doctorId: user.doctorId, estado: "ACTIVA" },
    select: { id: true },
  });
  if (!asignacion) throw new AuthzError("No tiene asignación activa con este paciente.");
}

// La asignación pertenece al doctor en sesión, está activa, y el paciente es de su
// mismo workspace (defensa en profundidad: hoy doctorId ya lo garantiza por
// construcción, pero esto deja de ser cierto en cuanto exista más de un workspace).
export async function assertAsignacionPropia(user: SessionUser, asignacionId: string) {
  if (user.rol !== "DOCTOR" || !user.doctorId) throw new AuthzError("Solo doctores pueden realizar esta acción.");
  const asignacion = await db.asignacion.findFirst({
    where: { id: asignacionId, doctorId: user.doctorId, estado: "ACTIVA" },
    include: { paciente: true, especialidad: true, doctor: { include: { usuario: true } } },
  });
  if (!asignacion) throw new AuthzError("La asignación no es suya o ya no está activa.");
  if (asignacion.paciente.workspaceId !== user.workspaceId) {
    throw new AuthzError("Paciente no encontrado.");
  }
  return asignacion;
}

// Verifica que un paciente pertenezca al workspace de quien actúa, sin exigir rol
// ni asignación — para acciones de captura (hoja de primer llenado) donde lo único
// que importa es que no se escriba en el expediente de otra organización.
export async function assertPacienteEnWorkspace(user: SessionUser, pacienteId: string) {
  const paciente = await db.paciente.findUnique({ where: { id: pacienteId }, select: { workspaceId: true } });
  if (!paciente || paciente.workspaceId !== user.workspaceId) throw new AuthzError("Paciente no encontrado.");
}

// Repositorio central: filtro de pacientes visibles para un doctor, siempre acotado
// a su workspace.
export function wherePacientesDeDoctor(doctorId: string, workspaceId: string) {
  return { workspaceId, asignaciones: { some: { doctorId, estado: "ACTIVA" as const } } };
}
