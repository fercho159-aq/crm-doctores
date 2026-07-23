"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, assertAsignacionPropia, AuthzError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import type { ActionState } from "./auth";

export async function iniciarExpedienteQx(asignacionId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR");
  let asignacion;
  try {
    asignacion = await assertAsignacionPropia(user, asignacionId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const fecha = String(fd.get("fechaCirugiaProgramada") ?? "");
  const qx = await db.expedienteQuirurgico.create({
    data: {
      asignacionId,
      pacienteId: asignacion.pacienteId,
      fechaCirugiaProgramada: fecha ? new Date(fecha) : null,
      quirofanoSede: String(fd.get("quirofanoSede") ?? "") || null,
    },
  });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "CREAR", entidad: "expediente_quirurgico",
    entidadId: qx.id, pacienteId: asignacion.pacienteId,
  });
  redirect(`/pacientes/${asignacion.pacienteId}/cirugias/${qx.id}`);
}

async function getQxPropio(user: Awaited<ReturnType<typeof requireRole>>, qxId: string) {
  const qx = await db.expedienteQuirurgico.findUnique({
    where: { id: qxId },
    include: { asignacion: true, notaPre: true, notaPost: true },
  });
  if (!qx) throw new AuthzError("Expediente quirúrgico no encontrado.");
  await assertAsignacionPropia(user, qx.asignacionId);
  return qx;
}

// ── Nota preoperatoria (NOM-004 8.5) ──────────────────────────────

const preSchema = z.object({
  diagnosticoPreoperatorio: z.string().optional(),
  planQuirurgico: z.string().optional(),
  tipoCirugia: z.string().optional(),
  riesgoQuirurgico: z.string().optional(),
  cuidadosPlanTerapeutico: z.string().optional(),
  pronostico: z.string().optional(),
});

export async function guardarNotaPre(qxId: string, firmar: boolean, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR");
  let qx;
  try {
    qx = await getQxPropio(user, qxId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = preSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (qx.notaPre && qx.notaPre.estado !== "BORRADOR") return { error: "La nota preoperatoria ya está firmada (inmutable)." };
  if (firmar) {
    const faltan = [
      [!d.diagnosticoPreoperatorio?.trim(), "diagnóstico preoperatorio"],
      [!d.planQuirurgico?.trim(), "plan quirúrgico"],
      [!d.tipoCirugia?.trim(), "tipo de cirugía"],
      [!d.riesgoQuirurgico?.trim(), "riesgo quirúrgico"],
      [!d.pronostico?.trim(), "pronóstico"],
    ].filter(([f]) => f).map(([, n]) => n);
    if (faltan.length) return { error: `NOM-004 8.5 — faltan: ${faltan.join(", ")}.` };
  }

  const data = { ...d, elaboradaPorId: user.id, ...(firmar ? { estado: "FIRMADA" as const, fechaFirma: new Date() } : {}) };
  const nota = qx.notaPre
    ? await db.notaPreoperatoria.update({ where: { id: qx.notaPre.id }, data })
    : await db.notaPreoperatoria.create({ data: { expedienteId: qxId, ...data } });

  await audit({
    usuarioId: user.id, rol: user.rol, accion: firmar ? "FIRMAR" : "GUARDAR_BORRADOR",
    entidad: "nota_preoperatoria", entidadId: nota.id, pacienteId: qx.pacienteId,
  });
  revalidatePath(`/pacientes/${qx.pacienteId}/cirugias/${qxId}`);
  return { ok: true };
}

// ── Nota postoperatoria (NOM-004 8.8) ──────────────────────────────

const postSchema = z.object({
  diagnosticoPreoperatorio: z.string().optional(),
  operacionPlaneada: z.string().optional(),
  operacionRealizada: z.string().optional(),
  diagnosticoPostoperatorio: z.string().optional(),
  descripcionTecnica: z.string().optional(),
  hallazgos: z.string().optional(),
  conteoGasas: z.string().optional(),
  incidentesAccidentes: z.string().optional(),
  cuantificacionSangrado: z.string().optional(),
  transfusiones: z.string().optional(),
  estudiosTransoperatorios: z.string().optional(),
  equipoQuirurgico: z.string().optional(),
  estadoPostquirurgico: z.string().optional(),
  planManejo: z.string().optional(),
  pronostico: z.string().optional(),
  envioPiezasPatologia: z.string().optional(),
});

export async function guardarNotaPost(qxId: string, firmar: boolean, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR");
  let qx;
  try {
    qx = await getQxPropio(user, qxId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = postSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (qx.notaPost && qx.notaPost.estado !== "BORRADOR") return { error: "La nota postoperatoria ya está firmada (inmutable)." };
  if (firmar) {
    const faltan = [
      [!d.operacionRealizada?.trim(), "operación realizada"],
      [!d.diagnosticoPostoperatorio?.trim(), "diagnóstico postoperatorio"],
      [!d.descripcionTecnica?.trim(), "descripción de la técnica quirúrgica"],
      [!d.conteoGasas?.trim(), "reporte de conteo de gasas, compresas e instrumental"],
      [!d.cuantificacionSangrado?.trim(), "cuantificación de sangrado"],
      [!d.estadoPostquirurgico?.trim(), "estado postquirúrgico inmediato"],
      [!d.planManejo?.trim(), "plan de manejo y tratamiento"],
      [!d.pronostico?.trim(), "pronóstico"],
    ].filter(([f]) => f).map(([, n]) => n);
    if (faltan.length) return { error: `NOM-004 8.8 — faltan: ${faltan.join(", ")}.` };
  }

  const data = { ...d, elaboradaPorId: user.id, ...(firmar ? { estado: "FIRMADA" as const, fechaFirma: new Date() } : {}) };
  const nota = qx.notaPost
    ? await db.notaPostoperatoria.update({ where: { id: qx.notaPost.id }, data })
    : await db.notaPostoperatoria.create({ data: { expedienteId: qxId, ...data } });

  if (firmar) {
    await db.expedienteQuirurgico.update({ where: { id: qxId }, data: { estado: "REALIZADA" } });
  }
  await audit({
    usuarioId: user.id, rol: user.rol, accion: firmar ? "FIRMAR" : "GUARDAR_BORRADOR",
    entidad: "nota_postoperatoria", entidadId: nota.id, pacienteId: qx.pacienteId,
  });
  revalidatePath(`/pacientes/${qx.pacienteId}/cirugias/${qxId}`);
  return { ok: true };
}

// ── Citas postoperatorias ──────────────────────────────

const citaSchema = z.object({
  fechaHoraProgramada: z.string().refine((v) => !isNaN(Date.parse(v)), "Fecha/hora inválida"),
  motivo: z.string().min(3, "Motivo requerido"),
});

export async function programarCita(qxId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR");
  let qx;
  try {
    qx = await getQxPropio(user, qxId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = citaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const cita = await db.citaPostoperatoria.create({
    data: {
      expedienteQxId: qxId,
      asignacionId: qx.asignacionId,
      fechaHoraProgramada: new Date(parsed.data.fechaHoraProgramada),
      motivo: parsed.data.motivo,
    },
  });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "CREAR", entidad: "cita_postoperatoria",
    entidadId: cita.id, pacienteId: qx.pacienteId,
  });
  revalidatePath(`/pacientes/${qx.pacienteId}/cirugias/${qxId}`);
  return { ok: true };
}

export async function actualizarCita(citaId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR");
  const cita = await db.citaPostoperatoria.findUnique({
    where: { id: citaId },
    include: { expedienteQx: true },
  });
  if (!cita) return { error: "Cita no encontrada." };
  try {
    await assertAsignacionPropia(user, cita.asignacionId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const estado = String(fd.get("estado") ?? "");
  if (!["REALIZADA", "NO_ASISTIO", "CANCELADA", "REPROGRAMADA"].includes(estado)) return { error: "Estado inválido." };
  const observaciones = String(fd.get("observaciones") ?? "") || null;
  const nuevaFecha = String(fd.get("nuevaFecha") ?? "");

  if (estado === "REPROGRAMADA") {
    if (!nuevaFecha || isNaN(Date.parse(nuevaFecha))) return { error: "Indique la nueva fecha." };
    await db.$transaction([
      db.citaPostoperatoria.update({ where: { id: citaId }, data: { estado: "REPROGRAMADA", observaciones } }),
      db.citaPostoperatoria.create({
        data: {
          expedienteQxId: cita.expedienteQxId,
          asignacionId: cita.asignacionId,
          fechaHoraProgramada: new Date(nuevaFecha),
          motivo: cita.motivo,
        },
      }),
    ]);
  } else {
    await db.citaPostoperatoria.update({ where: { id: citaId }, data: { estado: estado as never, observaciones } });
  }
  await audit({
    usuarioId: user.id, rol: user.rol, accion: estado, entidad: "cita_postoperatoria",
    entidadId: citaId, pacienteId: cita.expedienteQx.pacienteId,
  });
  revalidatePath(`/pacientes/${cita.expedienteQx.pacienteId}/cirugias/${cita.expedienteQxId}`);
  revalidatePath("/mi-consulta");
  return { ok: true };
}
