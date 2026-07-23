"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, assertAsignacionPropia, AuthzError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import type { ActionState } from "./auth";

// ── Tomar paciente ──────────────────────────────────────────────

export async function tomarPaciente(_p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR");
  if (!user.doctorId) return { error: "Su cuenta no tiene perfil de doctor." };
  const pacienteId = String(fd.get("pacienteId") ?? "");
  const especialidadId = String(fd.get("especialidadId") ?? "");
  if (!pacienteId || !especialidadId) return { error: "Seleccione la especialidad con la que tomará al paciente." };

  const ejerce = await db.doctorEspecialidad.findUnique({
    where: { doctorId_especialidadId: { doctorId: user.doctorId, especialidadId } },
  });
  if (!ejerce) return { error: "No tiene registrada esa especialidad." };

  const dup = await db.asignacion.findFirst({
    where: { pacienteId, especialidadId, doctorId: user.doctorId, estado: "ACTIVA" },
  });
  if (dup) redirect(`/pacientes/${pacienteId}`);

  const asignacion = await db.asignacion.create({
    data: { pacienteId, especialidadId, doctorId: user.doctorId },
  });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "TOMAR_PACIENTE", entidad: "asignacion",
    entidadId: asignacion.id, pacienteId,
  });
  redirect(`/pacientes/${pacienteId}`);
}

export async function darAlta(asignacionId: string, fd: FormData) {
  const user = await requireRole("DOCTOR");
  const asignacion = await assertAsignacionPropia(user, asignacionId);
  const motivo = String(fd.get("motivo") ?? "Alta de la especialidad");
  await db.asignacion.update({
    where: { id: asignacionId },
    data: { estado: "ALTA", fechaCierre: new Date(), motivo },
  });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "ALTA", entidad: "asignacion",
    entidadId: asignacionId, pacienteId: asignacion.pacienteId, datosDespues: { motivo },
  });
  redirect("/mi-consulta");
}

// ── Notas de evolución (SOAP) ──────────────────────────────────────────────

const notaSchema = z.object({
  subjetivo: z.string().optional(),
  objetivo: z.string().optional(),
  resultadosEstudios: z.string().optional(),
  diagnosticos: z.string().optional(),
  pronostico: z.string().optional(),
  planTratamiento: z.string().optional(),
});

export async function guardarNota(
  asignacionId: string,
  notaId: string | null,
  firmar: boolean,
  _p: ActionState,
  fd: FormData,
): Promise<ActionState & { notaId?: string }> {
  const user = await requireRole("DOCTOR");
  let asignacion;
  try {
    asignacion = await assertAsignacionPropia(user, asignacionId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = notaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  if (firmar) {
    const faltan: string[] = [];
    if (!d.diagnosticos?.trim()) faltan.push("diagnóstico");
    if (!d.planTratamiento?.trim()) faltan.push("plan de tratamiento (medicamento, dosis, vía y periodicidad — NOM-004 6.2)");
    if (faltan.length) return { error: `Para firmar faltan: ${faltan.join(", ")}.` };
  }

  let nota;
  if (notaId) {
    const existente = await db.notaEvolucion.findUnique({ where: { id: notaId } });
    if (!existente || existente.asignacionId !== asignacionId) return { error: "Nota no encontrada." };
    if (existente.estado !== "BORRADOR") return { error: "La nota ya está firmada; use una adenda." };
    if (existente.elaboradaPorId !== user.id) return { error: "Solo el autor puede editar el borrador." };
    nota = await db.notaEvolucion.update({
      where: { id: notaId },
      data: { ...d, ...(firmar ? { estado: "FIRMADA" as const, fechaFirma: new Date() } : {}) },
    });
  } else {
    nota = await db.notaEvolucion.create({
      data: {
        asignacionId,
        elaboradaPorId: user.id,
        ...d,
        ...(firmar ? { estado: "FIRMADA" as const, fechaFirma: new Date() } : {}),
      },
    });
  }
  await audit({
    usuarioId: user.id, rol: user.rol, accion: firmar ? "FIRMAR" : "GUARDAR_BORRADOR",
    entidad: "nota_evolucion", entidadId: nota.id, pacienteId: asignacion.pacienteId,
  });
  revalidatePath(`/pacientes/${asignacion.pacienteId}`);
  return { ok: true, notaId: nota.id };
}

export async function crearAdenda(notaPadreId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR");
  const padre = await db.notaEvolucion.findUnique({
    where: { id: notaPadreId },
    include: { asignacion: true },
  });
  if (!padre || padre.estado !== "FIRMADA") return { error: "Solo se adendan notas firmadas." };
  try {
    await assertAsignacionPropia(user, padre.asignacionId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const texto = String(fd.get("texto") ?? "").trim();
  if (texto.length < 5) return { error: "Escriba el contenido de la adenda." };
  const adenda = await db.notaEvolucion.create({
    data: {
      asignacionId: padre.asignacionId,
      notaPadreId,
      elaboradaPorId: user.id,
      subjetivo: texto,
      estado: "FIRMADA",
      fechaFirma: new Date(),
    },
  });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "ADENDAR", entidad: "nota_evolucion",
    entidadId: adenda.id, pacienteId: padre.asignacion.pacienteId,
    datosDespues: { notaPadreId },
  });
  revalidatePath(`/pacientes/${padre.asignacion.pacienteId}`);
  return { ok: true };
}
