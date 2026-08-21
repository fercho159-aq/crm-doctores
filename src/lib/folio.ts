import "server-only";
import type { Prisma, TipoWorkspace } from "@prisma/client";

// Folios consecutivos legibles. Se generan dentro de una transacción con lock
// consultivo para evitar duplicados bajo concurrencia.
//
// "MIT-" identifica expedientes de la clínica institucional; un médico BASIC no
// pertenece a Medical Tower, así que sus expedientes usan un prefijo genérico.
export async function siguienteFolio(
  tx: Prisma.TransactionClient,
  tabla: "paciente" | "receta",
  workspaceTipo: TipoWorkspace = "CLINIC",
): Promise<string> {
  const year = new Date().getFullYear();
  if (tabla === "paciente") {
    const prefijo = workspaceTipo === "BASIC" ? "EXP" : "MIT";
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('folio_paciente_' || ${prefijo}))`;
    const count = await tx.paciente.count({
      where: { numeroExpediente: { startsWith: `${prefijo}-${year}-` } },
    });
    return `${prefijo}-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('folio_receta'))`;
  const count = await tx.receta.count({
    where: { folio: { startsWith: `RX-${year}-` } },
  });
  return `RX-${year}-${String(count + 1).padStart(6, "0")}`;
}
