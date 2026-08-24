import "server-only";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePaciente } from "@/lib/authz";
import { audit } from "@/lib/audit";

// Análogo a pacientes/[id]/expediente.ts::cargarExpediente, pero para el portal:
// el paciente SIEMPRE sale de la sesión (session.pacienteId), nunca de un
// parámetro de ruta — no hay [id] en ninguna URL de /portal por diseño, así que
// no existe una entrada que un paciente pueda editar para ver el expediente de
// otro.
export async function cargarPacientePropio(opts?: { sinBitacora?: boolean }) {
  const user = await requirePaciente();
  const paciente = await db.paciente.findUnique({ where: { id: user.pacienteId } });
  if (!paciente) notFound();
  if (!opts?.sinBitacora) {
    await audit({
      usuarioId: user.id, rol: "PACIENTE", accion: "CONSULTAR_PORTAL",
      entidad: "paciente", entidadId: paciente.id, pacienteId: paciente.id,
    });
  }
  return { user, paciente };
}

export function nombreCompleto(p: { nombre: string; apellidoPaterno: string; apellidoMaterno: string | null }) {
  return `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno ?? ""}`.trim();
}
