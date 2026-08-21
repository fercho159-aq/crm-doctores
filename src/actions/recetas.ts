"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, assertAsignacionPropia, AuthzError } from "@/lib/authz";
import { siguienteFolio } from "@/lib/folio";
import { audit } from "@/lib/audit";
import { encolarReceta, reintentarEnvio } from "@/lib/email";
import { generarPdfReceta, edadDe, fechaLarga } from "@/lib/pdf";
import type { ActionState } from "./auth";

const partidaSchema = z.object({
  medicamento: z.string().min(2, "Denominación genérica del medicamento obligatoria (RIS)"),
  presentacion: z.string().optional(),
  dosis: z.string().min(1, "Dosis obligatoria"),
  viaAdministracion: z.string().min(1, "Vía de administración obligatoria"),
  frecuencia: z.string().min(1, "Frecuencia obligatoria"),
  duracion: z.string().min(1, "Duración obligatoria"),
  cantidad: z.string().optional(),
  indicaciones: z.string().optional(),
});

const recetaSchema = z.object({
  diagnostico: z.string().optional(),
  indicacionesGenerales: z.string().optional(),
  proximaCita: z.string().optional(),
  partidas: z.array(partidaSchema).min(1, "Agregue al menos un medicamento"),
});

export async function emitirReceta(
  asignacionId: string,
  _p: ActionState,
  fd: FormData,
): Promise<ActionState> {
  const user = await requireRole("DOCTOR");
  let asignacion;
  try {
    asignacion = await assertAsignacionPropia(user, asignacionId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }

  const doctor = await db.doctor.findUniqueOrThrow({
    where: { id: asignacion.doctorId },
    include: { usuario: true },
  });
  // LGS 28 bis: sin cédula no se emite receta
  if (!doctor.cedulaProfesional?.trim()) {
    return { error: "Su perfil no tiene cédula profesional registrada; no es posible emitir recetas. Contacte al administrador." };
  }

  let partidasRaw: unknown;
  try {
    partidasRaw = JSON.parse(String(fd.get("partidas") ?? "[]"));
  } catch {
    return { error: "Formato de medicamentos inválido." };
  }
  const parsed = recetaSchema.safeParse({
    diagnostico: String(fd.get("diagnostico") ?? "") || undefined,
    indicacionesGenerales: String(fd.get("indicacionesGenerales") ?? "") || undefined,
    proximaCita: String(fd.get("proximaCita") ?? "") || undefined,
    partidas: partidasRaw,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // CLINIC: domicilio institucional único (Configuración, gestionada por el Administrador).
  // BASIC: el médico no tiene Administrador — usa el domicilio de su propio consultorio.
  let establecimiento: { razonSocial: string; domicilio: string; telefono: string; logotipo: string | null };
  if (user.workspaceTipo === "BASIC") {
    if (!doctor.domicilioConsultorio?.trim()) {
      return { error: "Falta el domicilio de su consultorio (obligatorio en la receta — RIS art. 28). Complételo en Mi perfil." };
    }
    establecimiento = {
      razonSocial: doctor.usuario.nombreCompleto,
      domicilio: doctor.domicilioConsultorio,
      telefono: doctor.telefono ?? "",
      logotipo: null,
    };
  } else {
    const config = await db.configuracion.findUniqueOrThrow({ where: { id: 1 } });
    if (!config.domicilio?.trim()) {
      return { error: "Falta el domicilio del establecimiento en Configuración (obligatorio en la receta — RIS art. 28). Pida al administrador completarlo." };
    }
    establecimiento = { razonSocial: config.razonSocial, domicilio: config.domicilio, telefono: config.telefono, logotipo: config.logotipo };
  }
  const paciente = asignacion.paciente;
  const ultimaHoja = await db.hojaPrimerLlenado.findFirst({
    where: { pacienteId: paciente.id, estado: "CERRADA" },
    orderBy: { version: "desc" },
  });

  // Snapshot congelado del emisor y paciente (el documento legal no muta)
  const snapshotMedico = {
    nombre: doctor.usuario.nombreCompleto,
    cedulaProfesional: doctor.cedulaProfesional,
    cedulaEspecialidad: doctor.cedulaEspecialidad,
    institucionTitulo: doctor.institucionTitulo,
    universidadEspecialidad: doctor.universidadEspecialidad,
    especialidad: asignacion.especialidad.nombre,
    establecimiento,
  };
  const snapshotPaciente = {
    nombre: `${paciente.nombre} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno ?? ""}`.trim(),
    expediente: paciente.numeroExpediente,
    fechaNacimiento: paciente.fechaNacimiento.toISOString(),
    sexo: paciente.sexo,
    email: paciente.email,
  };

  const receta = await db.$transaction(async (tx) => {
    const folio = await siguienteFolio(tx, "receta");
    return tx.receta.create({
      data: {
        folio,
        asignacionId,
        diagnostico: d.diagnostico,
        indicacionesGenerales: d.indicacionesGenerales,
        proximaCita: d.proximaCita,
        snapshotMedico,
        snapshotPaciente,
        estadoEnvio: paciente.email ? "PENDIENTE" : "SIN_CORREO",
        partidas: {
          create: d.partidas.map((p, i) => ({
            orden: i + 1,
            medicamento: p.medicamento,
            presentacion: p.presentacion || null,
            dosis: p.dosis,
            viaAdministracion: p.viaAdministracion,
            frecuencia: p.frecuencia,
            duracion: p.duracion,
            cantidad: p.cantidad || null,
            indicaciones: p.indicaciones || null,
          })),
        },
      },
    });
  });

  // PDF (fuera de la tx: la receta ya existe con folio; el correo nunca condiciona el documento)
  const { documentoId } = await generarPdfReceta(
    {
      folio: receta.folio,
      fechaEmision: fechaLarga(receta.fechaEmision),
      establecimiento,
      medico: {
        nombre: doctor.usuario.nombreCompleto,
        especialidad: asignacion.especialidad.nombre,
        cedulaProfesional: doctor.cedulaProfesional,
        cedulaEspecialidad: doctor.cedulaEspecialidad,
        institucionTitulo: doctor.institucionTitulo,
        universidadEspecialidad: doctor.universidadEspecialidad,
        firmaDigitalizada: doctor.firmaDigitalizada,
      },
      paciente: {
        nombre: snapshotPaciente.nombre,
        edad: edadDe(paciente.fechaNacimiento),
        sexo: paciente.sexo === "M" ? "Masculino" : paciente.sexo === "F" ? "Femenino" : "Otro",
        expediente: paciente.numeroExpediente,
        peso: ultimaHoja?.pesoKg ? String(ultimaHoja.pesoKg) : null,
      },
      diagnostico: d.diagnostico,
      partidas: d.partidas,
      indicacionesGenerales: d.indicacionesGenerales,
      proximaCita: d.proximaCita,
    },
    paciente.id,
    user.id,
  );
  await db.receta.update({ where: { id: receta.id }, data: { documentoId } });

  if (paciente.email) {
    await encolarReceta(receta.id, paciente.email);
  }

  await audit({
    usuarioId: user.id, rol: user.rol, accion: "FIRMAR", entidad: "receta",
    entidadId: receta.id, pacienteId: paciente.id,
    datosDespues: { folio: receta.folio, medicamentos: d.partidas.length, destinatario: paciente.email ?? "SIN_CORREO" },
  });
  redirect(`/pacientes/${paciente.id}/recetas/${receta.id}`);
}

export async function cancelarReceta(recetaId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR");
  const receta = await db.receta.findUnique({ where: { id: recetaId }, include: { asignacion: true } });
  if (!receta) return { error: "Receta no encontrada." };
  try {
    await assertAsignacionPropia(user, receta.asignacionId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const motivo = String(fd.get("motivo") ?? "").trim();
  if (motivo.length < 5) return { error: "Escriba el motivo de la cancelación (obligatorio)." };
  if (receta.estado === "CANCELADA") return { error: "La receta ya está cancelada." };
  await db.receta.update({ where: { id: recetaId }, data: { estado: "CANCELADA", motivoCancelacion: motivo } });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "CANCELAR", entidad: "receta",
    entidadId: recetaId, pacienteId: receta.asignacion.pacienteId, datosDespues: { motivo },
  });
  revalidatePath(`/pacientes/${receta.asignacion.pacienteId}`);
  return { ok: true };
}

export async function reenviarReceta(recetaId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("DOCTOR", "ADMIN");
  const receta = await db.receta.findUnique({ where: { id: recetaId }, include: { asignacion: { include: { paciente: true } } } });
  if (!receta || receta.asignacion.paciente.workspaceId !== user.workspaceId) return { error: "Receta no encontrada." };
  if (user.rol === "DOCTOR") {
    try {
      await assertAsignacionPropia(user, receta.asignacionId);
    } catch (e) {
      if (e instanceof AuthzError) return { error: e.message };
      throw e;
    }
  }
  const destinatario = String(fd.get("destinatario") ?? receta.asignacion.paciente.email ?? "").trim();
  if (!z.string().email().safeParse(destinatario).success) return { error: "Correo de destino inválido." };

  const enCola = await db.emailQueue.findFirst({ where: { recetaId } });
  if (enCola) {
    await reintentarEnvio(recetaId, destinatario);
  } else {
    await encolarReceta(recetaId, destinatario);
    await db.receta.update({ where: { id: recetaId }, data: { estadoEnvio: "PENDIENTE" } });
  }
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "REENVIAR_RECETA", entidad: "receta",
    entidadId: recetaId, pacienteId: receta.asignacion.pacienteId, datosDespues: { destinatario },
  });
  revalidatePath(`/pacientes/${receta.asignacion.pacienteId}/recetas/${recetaId}`);
  return { ok: true };
}
