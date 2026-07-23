import "server-only";
import { db } from "./db";
import type { Prisma } from "@prisma/client";

type AuditInput = {
  usuarioId?: string | null;
  rol?: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  pacienteId?: string | null;
  datosAntes?: Prisma.InputJsonValue;
  datosDespues?: Prisma.InputJsonValue;
  ipOrigen?: string | null;
};

// Bitácora append-only. Nunca falla la operación principal por un error de bitácora
// salvo acciones clínicas, donde el registro es obligatorio (se llama dentro de la tx).
export async function audit(input: AuditInput) {
  try {
    await db.bitacora.create({
      data: {
        usuarioId: input.usuarioId ?? null,
        rolSnapshot: input.rol ?? null,
        accion: input.accion,
        entidad: input.entidad,
        entidadId: input.entidadId ?? null,
        pacienteId: input.pacienteId ?? null,
        datosAntes: input.datosAntes,
        datosDespues: input.datosDespues,
        ipOrigen: input.ipOrigen ?? null,
      },
    });
  } catch (e) {
    console.error("[bitacora] error al registrar:", e);
  }
}
