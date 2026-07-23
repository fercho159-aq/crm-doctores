import "server-only";
import type { Prisma } from "@prisma/client";

// Folios consecutivos legibles. Se generan dentro de una transacción con lock
// consultivo para evitar duplicados bajo concurrencia.

export async function siguienteFolio(
  tx: Prisma.TransactionClient,
  tabla: "paciente" | "receta",
): Promise<string> {
  const year = new Date().getFullYear();
  if (tabla === "paciente") {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('folio_paciente'))`;
    const count = await tx.paciente.count({
      where: { numeroExpediente: { startsWith: `MIT-${year}-` } },
    });
    return `MIT-${year}-${String(count + 1).padStart(5, "0")}`;
  }
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('folio_receta'))`;
  const count = await tx.receta.count({
    where: { folio: { startsWith: `RX-${year}-` } },
  });
  return `RX-${year}-${String(count + 1).padStart(6, "0")}`;
}
