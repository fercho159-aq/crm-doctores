"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, assertAsignacionPropia, AuthzError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import type { ActionState } from "./auth";

// El médico revisa lo que el paciente aportó y decide si lo incorpora (tecleándolo
// él mismo en su propia nota, para no mezclar autorías) o lo rechaza. La
// aportación en sí nunca se escribe sobre HojaPrimerLlenado ni NotaEvolucion.
const revisionSchema = z.object({
  asignacionId: z.string().uuid(),
  decision: z.enum(["INCORPORADA", "RECHAZADA"]),
  notaRevisor: z.string().optional(),
});

export async function revisarAportacion(aportacionId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR");
  const parsed = revisionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const aportacion = await db.aportacionPaciente.findUnique({ where: { id: aportacionId } });
  if (!aportacion) return { error: "Aportación no encontrada." };
  if (aportacion.estado !== "PENDIENTE_REVISION") return { error: "Esta aportación ya fue revisada." };

  try {
    // Reutiliza la validación de asignación activa: solo el doctor con
    // relación vigente con el paciente puede revisar lo que aportó.
    const asignacion = await assertAsignacionPropia(user, parsed.data.asignacionId);
    if (asignacion.pacienteId !== aportacion.pacienteId) return { error: "La asignación no corresponde a este paciente." };
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }

  await db.aportacionPaciente.update({
    where: { id: aportacionId },
    data: {
      estado: parsed.data.decision,
      revisadoPorId: user.id,
      notaRevisor: parsed.data.notaRevisor || null,
      revisadoEn: new Date(),
    },
  });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "REVISAR_APORTACION", entidad: "aportacion_paciente",
    entidadId: aportacionId, pacienteId: aportacion.pacienteId, datosDespues: { decision: parsed.data.decision },
  });
  revalidatePath(`/pacientes/${aportacion.pacienteId}/historia`);
  return { ok: true };
}
