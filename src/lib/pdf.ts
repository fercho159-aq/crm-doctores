import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import React from "react";
import { db } from "./db";
import { RecetaPdf, type RecetaPdfData } from "@/pdf/RecetaPdf";
import type { TipoDocumento } from "@prisma/client";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "/data/uploads";

export function edadDe(fechaNacimiento: Date): string {
  const hoy = new Date();
  let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
  const m = hoy.getMonth() - fechaNacimiento.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) edad--;
  return `${edad} años`;
}

export function fechaLarga(d: Date): string {
  return d.toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Mexico_City",
  });
}

// Genera el PDF, lo guarda en /data/uploads y registra el documento con hash.
export async function generarPdfReceta(
  data: RecetaPdfData,
  pacienteId: string,
  subidoPorId: string,
): Promise<{ documentoId: string; hash: string }> {
  const buffer = await renderToBuffer(React.createElement(RecetaPdf, { data }) as never);
  const hash = createHash("sha256").update(buffer).digest("hex");
  const dataConHash = { ...data, hashDocumento: hash };
  const bufferFinal = await renderToBuffer(React.createElement(RecetaPdf, { data: dataConHash }) as never);
  const hashFinal = createHash("sha256").update(bufferFinal).digest("hex");

  const dir = path.join(UPLOADS_DIR, "recetas", String(new Date().getFullYear()));
  await mkdir(dir, { recursive: true });
  const nombreArchivo = `${data.folio}.pdf`;
  const ruta = path.join(dir, nombreArchivo);
  await writeFile(ruta, bufferFinal);

  const doc = await db.documento.create({
    data: {
      pacienteId,
      tipo: "RECETA" as TipoDocumento,
      nombreArchivo,
      ruta,
      hashSha256: hashFinal,
      subidoPorId,
    },
  });
  return { documentoId: doc.id, hash: hashFinal };
}
