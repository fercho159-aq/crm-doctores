"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import React from "react";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, AuthzError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { guardarFormatoPdf } from "@/lib/pdf";
import { cargarEstablecimiento, pacientePdf, fmt, fmtFechaCorta } from "@/lib/formatos";
import { PrescripcionMedicaPdf, OrdenesMedicasPdf, type MedicoPdf } from "@/pdf/formatos";
import type { ActionState } from "./auth";
import type { CategoriaOrden } from "@prisma/client";

// Hojas oficiales 1 y 9-10: prescripción médica de medicamentos y hoja de
// órdenes médicas del paciente hospitalizado. Ambas siguen el mismo ciclo que
// las notas: borrador editable → firmada e inmutable (NOM-004).

const CATEGORIAS: CategoriaOrden[] = ["DIETA", "CUIDADOS", "SOLUCIONES", "MEDICAMENTOS", "ESTUDIOS", "OTRO"];

/** El doctor en sesión debe tener asignación activa con el paciente. */
async function contextoHoja(pacienteId: string) {
  const user = await requireRole("DOCTOR");
  const asignacion = await db.asignacion.findFirst({
    where: { pacienteId, doctorId: user.doctorId ?? "", estado: "ACTIVA" },
    orderBy: { fechaAsignacion: "desc" },
  });
  if (!asignacion) throw new AuthzError("No tiene asignación activa con este paciente.");
  return { user, asignacionId: asignacion.id };
}

/** Contexto de impresión: establecimiento, paciente y médico firmante. */
async function contextoPdf(pacienteId: string, asignacionId: string) {
  const user = await requireRole("DOCTOR", "ADMIN");
  const asignacion = await db.asignacion.findUniqueOrThrow({
    where: { id: asignacionId },
    include: { doctor: { include: { usuario: true } }, especialidad: true },
  });
  if (user.rol === "DOCTOR" && asignacion.doctorId !== user.doctorId) {
    throw new AuthzError("La hoja pertenece a otro médico tratante.");
  }
  const [est, paciente] = await Promise.all([
    cargarEstablecimiento(),
    db.paciente.findUniqueOrThrow({ where: { id: pacienteId } }),
  ]);
  if (paciente.workspaceId !== user.workspaceId) throw new AuthzError("Paciente no encontrado.");
  const medico: MedicoPdf = {
    nombre: asignacion.doctor.usuario.nombreCompleto,
    cedulaProfesional: asignacion.doctor.cedulaProfesional,
    cedulaEspecialidad: asignacion.doctor.cedulaEspecialidad,
    especialidad: asignacion.especialidad.nombre,
    firmaDigitalizada: asignacion.doctor.firmaDigitalizada,
  };
  return { user, est, paciente, medico };
}

// ── Prescripción médica de medicamentos (hoja oficial 1) ────────────────

const prescripcionSchema = z.object({
  cuarto: z.string().optional(),
  diagnostico: z.string().optional(),
  dieta: z.string().optional(),
});

/** Lee los renglones repetidos del formulario y descarta los vacíos. */
function leerPartidasPrescripcion(fd: FormData) {
  const fechas = fd.getAll("p_fecha").map(String);
  const meds = fd.getAll("p_medicamento").map(String);
  const dosis = fd.getAll("p_dosis").map(String);
  const vias = fd.getAll("p_via").map(String);
  const horarios = fd.getAll("p_horario").map(String);
  return meds
    .map((medicamento, i) => ({
      orden: i + 1,
      fecha: fechas[i] ?? "",
      medicamento: medicamento.trim(),
      dosis: (dosis[i] ?? "").trim(),
      via: (vias[i] ?? "").trim(),
      horario: (horarios[i] ?? "").trim(),
    }))
    .filter((p) => p.medicamento.length > 0);
}

export async function guardarPrescripcion(
  pacienteId: string,
  firmar: boolean,
  _p: ActionState,
  fd: FormData,
): Promise<ActionState> {
  let ctx;
  try {
    ctx = await contextoHoja(pacienteId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = prescripcionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const hojaId = String(fd.get("hojaId") ?? "");
  const partidas = leerPartidasPrescripcion(fd);
  if (firmar && partidas.length === 0) {
    return { error: "Capture al menos un medicamento antes de firmar la prescripción." };
  }
  const incompleta = partidas.find((p) => !p.dosis || !p.via || !p.horario);
  if (firmar && incompleta) {
    return { error: `«${incompleta.medicamento}»: la dosis, la vía y el horario son obligatorios.` };
  }
  for (const p of partidas) {
    if (p.fecha && isNaN(Date.parse(p.fecha))) return { error: `Fecha inválida en «${p.medicamento}».` };
  }

  const datos = { ...parsed.data, elaboradaPorId: ctx.user.id };

  const existente = hojaId
    ? await db.hojaPrescripcion.findUnique({ where: { id: hojaId }, select: { id: true, estado: true } })
    : null;
  if (existente && existente.estado !== "BORRADOR") return { error: "La prescripción ya está firmada (inmutable)." };

  // Los renglones se reemplazan en bloque: la hoja es la unidad que se firma.
  // El cambio a FIRMADA va al final, porque el trigger de la base rechaza
  // escribir renglones de una hoja que ya está firmada.
  const hoja = await db.$transaction(async (tx) => {
    const h = existente
      ? await tx.hojaPrescripcion.update({ where: { id: existente.id }, data: datos })
      : await tx.hojaPrescripcion.create({ data: { pacienteId, asignacionId: ctx.asignacionId, ...datos } });
    await tx.prescripcionPartida.deleteMany({ where: { hojaId: h.id } });
    if (partidas.length) {
      await tx.prescripcionPartida.createMany({
        data: partidas.map((p) => ({
          hojaId: h.id,
          orden: p.orden,
          fecha: p.fecha ? new Date(p.fecha) : new Date(),
          medicamento: p.medicamento,
          dosis: p.dosis,
          via: p.via,
          horario: p.horario,
        })),
      });
    }
    if (!firmar) return h;
    return tx.hojaPrescripcion.update({
      where: { id: h.id },
      data: { estado: "FIRMADA", fechaFirma: new Date() },
    });
  });

  await audit({
    usuarioId: ctx.user.id, rol: ctx.user.rol, accion: firmar ? "FIRMAR" : "GUARDAR_BORRADOR",
    entidad: "hoja_prescripcion", entidadId: hoja.id, pacienteId,
    datosDespues: { renglones: partidas.length },
  });
  revalidatePath(`/pacientes/${pacienteId}/prescripcion`);
  return { ok: true };
}

export async function generarPrescripcionPdf(hojaId: string): Promise<ActionState | void> {
  const hoja = await db.hojaPrescripcion.findUnique({
    where: { id: hojaId },
    include: { partidas: { orderBy: { orden: "asc" } } },
  });
  if (!hoja) return { error: "Prescripción no encontrada." };
  let c;
  try {
    c = await contextoPdf(hoja.pacienteId, hoja.asignacionId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(PrescripcionMedicaPdf, {
      d: {
        est: c.est,
        paciente: pacientePdf(c.paciente),
        medico: c.medico,
        cuarto: hoja.cuarto,
        diagnostico: hoja.diagnostico,
        dieta: hoja.dieta,
        partidas: hoja.partidas.map((p) => ({
          fecha: fmtFechaCorta(p.fecha),
          medicamento: p.medicamento,
          dosis: p.dosis,
          via: p.via,
          horario: p.horario,
        })),
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: hoja.pacienteId,
    tipo: "PRESCRIPCION",
    nombreArchivo: `Prescripcion-${c.paciente.numeroExpediente}.pdf`,
    subidoPorId: c.user.id,
  });
  await audit({
    usuarioId: c.user.id, rol: c.user.rol, accion: "GENERAR_FORMATO", entidad: "documento",
    entidadId: documentoId, pacienteId: hoja.pacienteId, datosDespues: { tipo: "PRESCRIPCION" },
  });
  redirect(`/api/documentos/${documentoId}`);
}

// ── Hoja de órdenes médicas (hojas oficiales 9-10) ──────────────────────

function leerPartidasOrdenes(fd: FormData) {
  const categorias = fd.getAll("o_categoria").map(String);
  const textos = fd.getAll("o_texto").map(String);
  return textos
    .map((texto, i) => ({
      orden: i + 1,
      categoria: (CATEGORIAS.includes(categorias[i] as CategoriaOrden)
        ? categorias[i]
        : "OTRO") as CategoriaOrden,
      texto: texto.trim(),
    }))
    .filter((o) => o.texto.length > 0);
}

export async function guardarOrdenes(
  pacienteId: string,
  firmar: boolean,
  _p: ActionState,
  fd: FormData,
): Promise<ActionState> {
  let ctx;
  try {
    ctx = await contextoHoja(pacienteId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const hojaId = String(fd.get("hojaId") ?? "");
  const cuarto = String(fd.get("cuarto") ?? "") || null;
  const partidas = leerPartidasOrdenes(fd);
  if (firmar && partidas.length === 0) return { error: "Capture al menos una indicación antes de firmar." };

  const existente = hojaId
    ? await db.hojaOrdenes.findUnique({ where: { id: hojaId }, select: { id: true, estado: true } })
    : null;
  if (existente && existente.estado !== "BORRADOR") {
    return { error: "La hoja de órdenes ya está firmada (inmutable); capture una hoja nueva." };
  }

  const datos = { cuarto, elaboradaPorId: ctx.user.id };

  // Igual que la prescripción: primero los renglones, la firma al final.
  const hoja = await db.$transaction(async (tx) => {
    const h = existente
      ? await tx.hojaOrdenes.update({ where: { id: existente.id }, data: datos })
      : await tx.hojaOrdenes.create({ data: { pacienteId, asignacionId: ctx.asignacionId, ...datos } });
    await tx.ordenPartida.deleteMany({ where: { hojaId: h.id } });
    if (partidas.length) {
      await tx.ordenPartida.createMany({ data: partidas.map((o) => ({ hojaId: h.id, ...o })) });
    }
    if (!firmar) return h;
    return tx.hojaOrdenes.update({ where: { id: h.id }, data: { estado: "FIRMADA", fechaFirma: new Date() } });
  });

  await audit({
    usuarioId: ctx.user.id, rol: ctx.user.rol, accion: firmar ? "FIRMAR" : "GUARDAR_BORRADOR",
    entidad: "hoja_ordenes_medicas", entidadId: hoja.id, pacienteId,
    datosDespues: { renglones: partidas.length },
  });
  revalidatePath(`/pacientes/${pacienteId}/ordenes`);
  return { ok: true };
}

export async function generarOrdenesPdf(hojaId: string): Promise<ActionState | void> {
  const hoja = await db.hojaOrdenes.findUnique({
    where: { id: hojaId },
    include: { partidas: { orderBy: { orden: "asc" } } },
  });
  if (!hoja) return { error: "Hoja de órdenes no encontrada." };
  let c;
  try {
    c = await contextoPdf(hoja.pacienteId, hoja.asignacionId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(OrdenesMedicasPdf, {
      d: {
        est: c.est,
        paciente: pacientePdf(c.paciente),
        medico: c.medico,
        cuarto: hoja.cuarto,
        fechaHora: fmtFechaCorta(hoja.fechaHora),
        partidas: hoja.partidas.map((o) => ({ categoria: o.categoria, texto: o.texto })),
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: hoja.pacienteId,
    tipo: "ORDENES_MEDICAS",
    nombreArchivo: `Ordenes-medicas-${c.paciente.numeroExpediente}.pdf`,
    subidoPorId: c.user.id,
  });
  await audit({
    usuarioId: c.user.id, rol: c.user.rol, accion: "GENERAR_FORMATO", entidad: "documento",
    entidadId: documentoId, pacienteId: hoja.pacienteId, datosDespues: { tipo: "ORDENES_MEDICAS" },
  });
  redirect(`/api/documentos/${documentoId}`);
}
