"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireRole, AuthzError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import type { ActionState } from "./auth";
import type { TipoDocumento } from "@prisma/client";

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "/data/uploads";
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS: TipoDocumento[] = ["CONSENTIMIENTO", "ESTUDIO", "OTRO"];

export async function subirDocumento(pacienteId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR", "ADMIN");
  try {
    // Doctor: solo con asignación activa. Admin: puede adjuntar documentación administrativa.
    if (user.rol === "DOCTOR") {
      const asignacion = await db.asignacion.findFirst({
        where: { pacienteId, doctorId: user.doctorId ?? "", estado: "ACTIVA" },
      });
      if (!asignacion) throw new AuthzError("No tiene asignación activa con este paciente.");
    }
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }

  const archivo = fd.get("archivo");
  const tipo = String(fd.get("tipo") ?? "OTRO") as TipoDocumento;
  if (!TIPOS.includes(tipo)) return { error: "Tipo de documento inválido." };
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Seleccione un archivo." };
  if (archivo.size > MAX_BYTES) return { error: "Archivo demasiado grande (máx. 10 MB)." };
  if (archivo.type !== "application/pdf" && !archivo.type.startsWith("image/")) {
    return { error: "Solo se aceptan PDF o imágenes (escaneos)." };
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex");
  const nombreLimpio = archivo.name.replace(/[^\w.\-áéíóúÁÉÍÓÚñÑ ]/g, "_").slice(0, 120);
  const dir = path.join(UPLOADS_DIR, "adjuntos", pacienteId);
  await mkdir(dir, { recursive: true });
  const ruta = path.join(dir, `${Date.now()}-${nombreLimpio}`);
  await writeFile(ruta, buffer);

  const doc = await db.documento.create({
    data: { pacienteId, tipo, nombreArchivo: nombreLimpio, ruta, hashSha256: hash, subidoPorId: user.id },
  });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "SUBIR_DOCUMENTO", entidad: "documento",
    entidadId: doc.id, pacienteId, datosDespues: { tipo, nombre: nombreLimpio, hash },
  });
  revalidatePath(`/pacientes/${pacienteId}/documentos`);
  return { ok: true };
}
