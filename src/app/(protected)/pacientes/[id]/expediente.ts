import "server-only";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, assertAccesoPaciente, AuthzError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import type { SessionUser } from "@/lib/auth";

// Carga común del expediente con control de acceso + registro de lectura en bitácora.
export async function cargarExpediente(pacienteId: string, opts?: { sinBitacora?: boolean }) {
  const user = await requireUser();
  const paciente = await db.paciente.findUnique({
    where: { id: pacienteId },
    include: {
      asignaciones: {
        include: { especialidad: true, doctor: { include: { usuario: true } } },
        orderBy: { fechaAsignacion: "desc" },
      },
    },
  });
  if (!paciente) notFound();
  try {
    await assertAccesoPaciente(user, pacienteId);
  } catch (e) {
    if (e instanceof AuthzError) redirect("/");
    throw e;
  }
  if (!opts?.sinBitacora) {
    await audit({
      usuarioId: user.id, rol: user.rol, accion: "CONSULTAR_EXPEDIENTE",
      entidad: "paciente", entidadId: pacienteId, pacienteId,
    });
  }
  const miAsignacionActiva =
    user.rol === "DOCTOR"
      ? paciente.asignaciones.find((a) => a.doctorId === user.doctorId && a.estado === "ACTIVA") ?? null
      : null;
  return { user: user as SessionUser, paciente, miAsignacionActiva };
}

export function nombreCompleto(p: { nombre: string; apellidoPaterno: string; apellidoMaterno: string | null }) {
  return `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno ?? ""}`.trim();
}
