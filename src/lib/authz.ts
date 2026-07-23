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

export class AuthzError extends Error {}

export async function assertRole(user: SessionUser, ...roles: RolClave[]) {
  if (!roles.includes(user.rol)) throw new AuthzError("No autorizado para esta acción.");
}

// Doctor solo accede a expedientes de pacientes con asignación ACTIVA suya.
// Admin: lectura global. Enfermería: sin acceso a expediente clínico.
export async function assertAccesoPaciente(user: SessionUser, pacienteId: string, opts?: { escritura?: boolean }) {
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

// La asignación pertenece al doctor en sesión y está activa (para escribir notas/recetas en ella).
export async function assertAsignacionPropia(user: SessionUser, asignacionId: string) {
  if (user.rol !== "DOCTOR" || !user.doctorId) throw new AuthzError("Solo doctores pueden realizar esta acción.");
  const asignacion = await db.asignacion.findFirst({
    where: { id: asignacionId, doctorId: user.doctorId, estado: "ACTIVA" },
    include: { paciente: true, especialidad: true, doctor: { include: { usuario: true } } },
  });
  if (!asignacion) throw new AuthzError("La asignación no es suya o ya no está activa.");
  return asignacion;
}

// Repositorio central: filtro de pacientes visibles para un doctor.
export function wherePacientesDeDoctor(doctorId: string) {
  return { asignaciones: { some: { doctorId, estado: "ACTIVA" as const } } };
}
