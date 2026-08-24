"use server";

import { revalidatePath } from "next/cache";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { z } from "zod";
import { db } from "@/lib/db";
import { requirePaciente } from "@/lib/authz";
import { audit } from "@/lib/audit";
import type { ActionState } from "./auth";
import type { CategoriaAporte, TipoDocumento } from "@prisma/client";

// Todas las acciones de este archivo resuelven el paciente exclusivamente desde
// requirePaciente() (session.pacienteId) — nunca aceptan un pacienteId por
// parámetro ni por FormData, así ningún paciente puede tocar el expediente de
// otro por más que manipule la petición.

// ── Mi perfil: solo datos administrativos (§5/§7 del plan). Nombre, apellidos,
//    fecha de nacimiento, CURP y sexo NO son editables aquí — requieren
//    solicitud de corrección revisada por Enfermería/Admin (fuera de esta fase). ──

const perfilSchema = z.object({
  telefono: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  calle: z.string().optional(),
  colonia: z.string().optional(),
  municipio: z.string().optional(),
  estado: z.string().optional(),
  cp: z.string().optional(),
  contactoEmergenciaNombre: z.string().optional(),
  contactoEmergenciaTelefono: z.string().optional(),
  contactoEmergenciaParentesco: z.string().optional(),
});

export async function actualizarPerfilPropio(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePaciente();
  const parsed = perfilSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const prefNotificacionEmail = fd.get("prefNotificacionEmail") === "on";

  const antes = await db.paciente.findUniqueOrThrow({
    where: { id: user.pacienteId },
    select: {
      telefono: true, email: true, calle: true, colonia: true, municipio: true, estado: true, cp: true,
      contactoEmergenciaNombre: true, contactoEmergenciaTelefono: true, contactoEmergenciaParentesco: true,
      prefNotificacionEmail: true,
    },
  });

  const despues = {
    telefono: d.telefono,
    email: d.email || null,
    calle: d.calle || null,
    colonia: d.colonia || null,
    municipio: d.municipio || null,
    estado: d.estado || null,
    cp: d.cp || null,
    contactoEmergenciaNombre: d.contactoEmergenciaNombre || null,
    contactoEmergenciaTelefono: d.contactoEmergenciaTelefono || null,
    contactoEmergenciaParentesco: d.contactoEmergenciaParentesco || null,
    prefNotificacionEmail,
  };

  await db.paciente.update({ where: { id: user.pacienteId }, data: despues });

  // Trazabilidad vía bitácora (patrón ya existente en el repo): la primera vez
  // que se edita Paciente post-alta queda registrado el antes/después completo.
  await audit({
    usuarioId: user.id, rol: "PACIENTE", accion: "ACTUALIZAR_PERFIL_PACIENTE",
    entidad: "paciente", entidadId: user.pacienteId, pacienteId: user.pacienteId,
    datosAntes: antes, datosDespues: despues,
  });
  revalidatePath("/portal/mi-perfil");
  return { ok: true };
}

const fotoSchema = z.object({ foto: z.string().startsWith("data:image/") });

export async function guardarFotoPropia(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePaciente();
  const parsed = fotoSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Imagen inválida." };
  if (parsed.data.foto.length > 500_000) return { error: "Imagen demasiado grande (máx ~350 KB)." };
  await db.paciente.update({ where: { id: user.pacienteId }, data: { fotoUrl: parsed.data.foto } });
  await audit({
    usuarioId: user.id, rol: "PACIENTE", accion: "ACTUALIZAR_PERFIL_PACIENTE",
    entidad: "paciente", entidadId: user.pacienteId, pacienteId: user.pacienteId,
    datosDespues: { foto: "actualizada" },
  });
  revalidatePath("/portal/mi-perfil");
  return { ok: true };
}

// ── Aportaciones clínicas: quedan PENDIENTE_REVISION; el profesional decide si
//    las incorpora a su propia nota (§8 del plan). Nunca tocan HojaPrimerLlenado
//    ni NotaEvolucion. ──

const CATEGORIAS: CategoriaAporte[] = ["ALERGIA", "MEDICAMENTO", "ANTECEDENTE", "SINTOMA", "OBSERVACION", "PRECONSULTA"];

const aportacionSchema = z.object({
  categoria: z.string(),
  contenido: z.string().min(3, "Escriba la información a reportar."),
});

export async function crearAportacion(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePaciente();
  const parsed = aportacionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const categoria = parsed.data.categoria as CategoriaAporte;
  if (!CATEGORIAS.includes(categoria)) return { error: "Categoría inválida." };

  const aportacion = await db.aportacionPaciente.create({
    data: { pacienteId: user.pacienteId, categoria, contenido: parsed.data.contenido, creadoPorId: user.id },
  });
  await audit({
    usuarioId: user.id, rol: "PACIENTE", accion: "APORTAR_INFORMACION", entidad: "aportacion_paciente",
    entidadId: aportacion.id, pacienteId: user.pacienteId, datosDespues: { categoria },
  });
  revalidatePath("/portal/expediente");
  return { ok: true };
}

// ── Documentos subidos por el paciente: reutiliza el mismo almacenamiento y
//    validación que subirDocumento() (actions/documentos.ts), pero acotado a su
//    propio expediente y marcado origen: PACIENTE para no confundirse con lo
//    emitido por el sistema/personal. ──

const UPLOADS_DIR = process.env.UPLOADS_DIR ?? "/data/uploads";
const MAX_BYTES = 10 * 1024 * 1024;
const TIPOS_PACIENTE: TipoDocumento[] = ["ESTUDIO", "OTRO"];

export async function subirDocumentoPropio(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requirePaciente();

  const archivo = fd.get("archivo");
  const tipo = String(fd.get("tipo") ?? "OTRO") as TipoDocumento;
  if (!TIPOS_PACIENTE.includes(tipo)) return { error: "Tipo de documento inválido." };
  if (!(archivo instanceof File) || archivo.size === 0) return { error: "Seleccione un archivo." };
  if (archivo.size > MAX_BYTES) return { error: "Archivo demasiado grande (máx. 10 MB)." };
  if (archivo.type !== "application/pdf" && !archivo.type.startsWith("image/")) {
    return { error: "Solo se aceptan PDF o imágenes (escaneos)." };
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex");
  const nombreLimpio = archivo.name.replace(/[^\w.\-áéíóúÁÉÍÓÚñÑ ]/g, "_").slice(0, 120);
  const dir = path.join(UPLOADS_DIR, "adjuntos", user.pacienteId);
  await mkdir(dir, { recursive: true });
  const ruta = path.join(dir, `${Date.now()}-${nombreLimpio}`);
  await writeFile(ruta, buffer);

  const doc = await db.documento.create({
    data: {
      pacienteId: user.pacienteId, tipo, nombreArchivo: nombreLimpio, ruta,
      hashSha256: hash, subidoPorId: user.id, origen: "PACIENTE",
    },
  });
  await audit({
    usuarioId: user.id, rol: "PACIENTE", accion: "SUBIR_DOCUMENTO", entidad: "documento",
    entidadId: doc.id, pacienteId: user.pacienteId, datosDespues: { tipo, nombre: nombreLimpio, hash, origen: "PACIENTE" },
  });
  revalidatePath("/portal/documentos");
  return { ok: true };
}
