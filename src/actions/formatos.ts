"use server";

import { redirect } from "next/navigation";
import React from "react";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, AuthzError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { guardarFormatoPdf } from "@/lib/pdf";
import { cargarEstablecimiento, pacientePdf, fmt, fmtFecha, fmtHora } from "@/lib/formatos";
import {
  HistoriaClinicaPdf,
  NotaEvolucionPdf,
  NotaQuirurgicaPdf,
  ConsentimientoQxPdf,
  ConsentimientoAnestesiaPdf,
  AutorizacionQxPdf,
  FichaIdentificacionPdf,
  DescripcionQxPdf,
  type MedicoPdf,
} from "@/pdf/formatos";
import type { ActionState } from "./auth";

// Un archivo "use server" sólo puede exportar funciones async: este esquema
// permanece local al módulo.
const firmaSchema = z
  .string()
  .startsWith("data:image/png")
  .max(700_000)
  .optional()
  .or(z.literal("").transform(() => undefined));

async function contexto(pacienteId: string) {
  const user = await requireRole("DOCTOR", "ADMIN");
  if (user.rol === "DOCTOR") {
    const asignacion = await db.asignacion.findFirst({
      where: { pacienteId, doctorId: user.doctorId ?? "", estado: "ACTIVA" },
    });
    if (!asignacion) throw new AuthzError("No tiene asignación activa con este paciente.");
  }
  const est = await cargarEstablecimiento();
  const paciente = await db.paciente.findUniqueOrThrow({ where: { id: pacienteId } });
  return { user, est, paciente };
}

async function registrar(user: { id: string; rol: string }, docId: string, pacienteId: string, tipo: string) {
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "GENERAR_FORMATO", entidad: "documento",
    entidadId: docId, pacienteId, datosDespues: { tipo },
  });
  redirect(`/api/documentos/${docId}`);
}

// ── 1. Historia clínica ─────────────────────────────────────────────

export async function generarHistoriaClinica(pacienteId: string): Promise<ActionState | void> {
  let ctx;
  try {
    ctx = await contexto(pacienteId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const hoja = await db.hojaPrimerLlenado.findFirst({
    where: { pacienteId, estado: "CERRADA" },
    include: { capturadoPor: true },
    orderBy: { version: "desc" },
  });
  if (!hoja) return { error: "No hay historia clínica cerrada para este paciente." };
  const p = ctx.paciente;

  const signos = [
    hoja.taSistolica && hoja.taDiastolica ? `TA ${hoja.taSistolica}/${hoja.taDiastolica} mmHg` : null,
    hoja.fc ? `FC ${hoja.fc} lpm` : null,
    hoja.fr ? `FR ${hoja.fr} rpm` : null,
    hoja.temperatura ? `Temp ${hoja.temperatura} °C` : null,
    hoja.spo2 ? `SatO2 ${hoja.spo2}%` : null,
    hoja.pesoKg ? `Peso ${hoja.pesoKg} kg` : null,
    hoja.tallaCm ? `Talla ${hoja.tallaCm} cm` : null,
    hoja.pesoKg && hoja.tallaCm
      ? `IMC ${(Number(hoja.pesoKg) / Math.pow(Number(hoja.tallaCm) / 100, 2)).toFixed(1)}`
      : null,
    hoja.glucosa ? `Glucosa ${hoja.glucosa} mg/dL` : null,
    hoja.escalaDolor !== null ? `Dolor ${hoja.escalaDolor}/10` : null,
  ].filter(Boolean).join(" · ");

  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(HistoriaClinicaPdf, {
      d: {
        est: ctx.est,
        paciente: {
          ...pacientePdf(p),
          estadoCivil: p.estadoCivil, ocupacion: p.ocupacion, escolaridad: p.escolaridad,
          religion: p.religion, nacionalidad: p.nacionalidad, referencia: p.referencia,
          tipoSangre: p.tipoSangre, curp: p.curp, derechohabiencia: p.derechohabiencia,
          contactoEmergencia: p.contactoEmergenciaNombre
            ? `${p.contactoEmergenciaNombre} (${p.contactoEmergenciaParentesco ?? "—"}) · ${p.contactoEmergenciaTelefono ?? ""}`
            : null,
        },
        hoja: {
          version: hoja.version,
          capturadoPor: hoja.capturadoPor.nombreCompleto,
          fechaCaptura: fmt(hoja.fechaHoraCaptura),
          motivoConsulta: hoja.motivoConsulta,
          padecimientoActual: hoja.padecimientoActual,
          heredofamiliares: hoja.antecedentesHeredofamiliares,
          patologicos: hoja.antecedentesPatologicos,
          noPatologicos: hoja.antecedentesNoPatologicos,
          ginecoObstetricos: hoja.antecedentesGinecoObstetricos,
          alergias: hoja.alergias,
          medicamentos: hoja.medicamentosActuales,
          interrogatorio: hoja.interrogatorioAparatos,
          cirugiaDeseada: hoja.cirugiaDeseada,
          presupuesto: hoja.presupuesto,
          fechaProgramada: hoja.fechaProgramadaDeseada,
          signos,
        },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId,
    tipo: "HISTORIA_CLINICA",
    nombreArchivo: `Historia-clinica-${p.numeroExpediente}-v${hoja.version}.pdf`,
    subidoPorId: ctx.user.id,
  });
  await registrar(ctx.user, documentoId, pacienteId, "HISTORIA_CLINICA");
}

// ── 2. Nota de evolución ─────────────────────────────────────────────

export async function generarNotaEvolucionPdf(notaId: string): Promise<ActionState | void> {
  const nota = await db.notaEvolucion.findUnique({
    where: { id: notaId },
    include: {
      asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } },
      elaboradaPor: true,
      adendas: { include: { elaboradaPor: true }, orderBy: { fechaHora: "asc" } },
    },
  });
  if (!nota || nota.estado !== "FIRMADA") return { error: "Solo se genera PDF de notas firmadas." };
  let ctx;
  try {
    ctx = await contexto(nota.asignacion.pacienteId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const doctor = nota.asignacion.doctor;
  const medico: MedicoPdf = {
    nombre: doctor.usuario.nombreCompleto,
    cedulaProfesional: doctor.cedulaProfesional,
    cedulaEspecialidad: doctor.cedulaEspecialidad,
    especialidad: nota.asignacion.especialidad.nombre,
    firmaDigitalizada: doctor.firmaDigitalizada,
  };
  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(NotaEvolucionPdf, {
      d: {
        est: ctx.est,
        paciente: pacientePdf(ctx.paciente),
        medico,
        nota: {
          fechaHora: fmt(nota.fechaHora),
          subjetivo: nota.subjetivo,
          objetivo: nota.objetivo,
          estudios: nota.resultadosEstudios,
          diagnosticos: nota.diagnosticos,
          pronostico: nota.pronostico,
          plan: nota.planTratamiento,
          adendas: nota.adendas.map((a) => ({
            fechaHora: fmt(a.fechaHora),
            autor: a.elaboradaPor.nombreCompleto,
            texto: a.subjetivo ?? "",
          })),
        },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: ctx.paciente.id,
    tipo: "NOTA_EVOLUCION",
    nombreArchivo: `Nota-evolucion-${ctx.paciente.numeroExpediente}-${nota.fechaHora.toISOString().slice(0, 10)}.pdf`,
    subidoPorId: ctx.user.id,
  });
  await registrar(ctx.user, documentoId, ctx.paciente.id, "NOTA_EVOLUCION");
}

// ── Contexto quirúrgico común ─────────────────────────────────────────

async function contextoQx(qxId: string) {
  const qx = await db.expedienteQuirurgico.findUnique({
    where: { id: qxId },
    include: {
      asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } },
      notaPre: true,
      notaPost: true,
    },
  });
  if (!qx) throw new AuthzError("Expediente quirúrgico no encontrado.");
  const ctx = await contexto(qx.pacienteId);
  const doctor = qx.asignacion.doctor;
  const medico: MedicoPdf = {
    nombre: doctor.usuario.nombreCompleto,
    cedulaProfesional: doctor.cedulaProfesional,
    cedulaEspecialidad: doctor.cedulaEspecialidad,
    especialidad: qx.asignacion.especialidad.nombre,
    firmaDigitalizada: doctor.firmaDigitalizada,
  };
  return { ...ctx, qx, medico };
}

// ── 3. Notas quirúrgicas (pre + post) ─────────────────────────────────

export async function generarNotaQuirurgica(qxId: string): Promise<ActionState | void> {
  let c;
  try {
    c = await contextoQx(qxId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  if (!c.qx.notaPre && !c.qx.notaPost) return { error: "El expediente quirúrgico aún no tiene notas." };
  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(NotaQuirurgicaPdf, {
      d: {
        est: c.est,
        paciente: pacientePdf(c.paciente),
        medico: c.medico,
        qx: {
          fechaProgramada: c.qx.fechaCirugiaProgramada ? fmt(c.qx.fechaCirugiaProgramada) : null,
          quirofano: c.qx.quirofanoSede,
          estado: c.qx.estado,
          consentimientoFecha: c.qx.consentimientoFecha ? fmtFecha(c.qx.consentimientoFecha) : null,
        },
        pre: c.qx.notaPre
          ? {
              fechaHora: fmt(c.qx.notaPre.fechaHora),
              diagnostico: c.qx.notaPre.diagnosticoPreoperatorio,
              plan: c.qx.notaPre.planQuirurgico,
              tipo: c.qx.notaPre.tipoCirugia,
              riesgo: c.qx.notaPre.riesgoQuirurgico,
              cuidados: c.qx.notaPre.cuidadosPlanTerapeutico,
              pronostico: c.qx.notaPre.pronostico,
            }
          : null,
        post: c.qx.notaPost
          ? {
              fechaHora: fmt(c.qx.notaPost.fechaHora),
              diagnosticoPre: c.qx.notaPost.diagnosticoPreoperatorio,
              operacionPlaneada: c.qx.notaPost.operacionPlaneada,
              operacionRealizada: c.qx.notaPost.operacionRealizada,
              diagnosticoPost: c.qx.notaPost.diagnosticoPostoperatorio,
              tecnica: c.qx.notaPost.descripcionTecnica,
              hallazgos: c.qx.notaPost.hallazgos,
              conteoGasas: c.qx.notaPost.conteoGasas,
              incidentes: c.qx.notaPost.incidentesAccidentes,
              sangrado: c.qx.notaPost.cuantificacionSangrado,
              transfusiones: c.qx.notaPost.transfusiones,
              estudios: c.qx.notaPost.estudiosTransoperatorios,
              equipo: c.qx.notaPost.equipoQuirurgico,
              estadoPost: c.qx.notaPost.estadoPostquirurgico,
              plan: c.qx.notaPost.planManejo,
              pronostico: c.qx.notaPost.pronostico,
              patologia: c.qx.notaPost.envioPiezasPatologia,
            }
          : null,
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: c.paciente.id,
    tipo: "NOTA_QUIRURGICA",
    nombreArchivo: `Notas-quirurgicas-${c.paciente.numeroExpediente}.pdf`,
    subidoPorId: c.user.id,
  });
  await registrar(c.user, documentoId, c.paciente.id, "NOTA_QUIRURGICA");
}

// ── 4. Consentimiento quirúrgico (firmado en tableta) ─────────────────

const consQxSchema = z.object({
  diagnostico: z.string().min(3, "Diagnóstico requerido"),
  actoPropuesto: z.string().min(10, "Describa el acto médico quirúrgico propuesto"),
  riesgos: z.string().min(10, "Describa los riesgos y posibles complicaciones"),
  firmaPaciente: firmaSchema,
  firmaResponsable: firmaSchema,
  firmaTestigo: firmaSchema,
  nombreResponsable: z.string().optional(),
  nombreTestigo: z.string().optional(),
});

export async function generarConsentimientoQx(qxId: string, _p: ActionState, fd: FormData): Promise<ActionState | void> {
  let c;
  try {
    c = await contextoQx(qxId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = consQxSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!d.firmaPaciente) return { error: "La firma del paciente es obligatoria (capture en la tableta)." };

  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(ConsentimientoQxPdf, {
      d: {
        est: c.est,
        paciente: pacientePdf(c.paciente),
        medico: c.medico,
        diagnostico: d.diagnostico,
        actoPropuesto: d.actoPropuesto,
        riesgos: d.riesgos,
        firmas: {
          paciente: d.firmaPaciente,
          responsable: d.firmaResponsable,
          testigo: d.firmaTestigo,
          nombreResponsable: d.nombreResponsable,
          nombreTestigo: d.nombreTestigo,
        },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: c.paciente.id,
    tipo: "CONSENTIMIENTO",
    nombreArchivo: `Consentimiento-quirurgico-${c.paciente.numeroExpediente}.pdf`,
    subidoPorId: c.user.id,
  });
  await db.expedienteQuirurgico.update({
    where: { id: qxId },
    data: { consentimientoDocId: documentoId, consentimientoFecha: new Date() },
  });
  await registrar(c.user, documentoId, c.paciente.id, "CONSENTIMIENTO");
}

// ── 5. Consentimiento de anestesia (firmado en tableta) ───────────────

const consAneSchema = z.object({
  anestesiologo: z.string().min(5, "Nombre del anestesiólogo requerido"),
  cedulaAnestesiologo: z.string().min(4, "Cédula del anestesiólogo requerida"),
  diagnostico: z.string().min(3, "Diagnóstico requerido"),
  actoQuirurgico: z.string().min(5, "Acto quirúrgico proyectado requerido"),
  firmaAnestesiologo: firmaSchema,
  firmaPaciente: firmaSchema,
  firmaResponsable: firmaSchema,
  nombreResponsable: z.string().optional(),
});

export async function generarConsentimientoAnestesia(qxId: string, _p: ActionState, fd: FormData): Promise<ActionState | void> {
  let c;
  try {
    c = await contextoQx(qxId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = consAneSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!d.firmaPaciente) return { error: "La firma del paciente es obligatoria (capture en la tableta)." };

  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(ConsentimientoAnestesiaPdf, {
      d: {
        est: c.est,
        paciente: pacientePdf(c.paciente),
        anestesiologo: { nombre: d.anestesiologo, cedula: d.cedulaAnestesiologo },
        diagnostico: d.diagnostico,
        actoQuirurgico: d.actoQuirurgico,
        firmas: {
          anestesiologo: d.firmaAnestesiologo,
          paciente: d.firmaPaciente,
          responsable: d.firmaResponsable,
          nombreResponsable: d.nombreResponsable,
        },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: c.paciente.id,
    tipo: "CONSENTIMIENTO_ANESTESIA",
    nombreArchivo: `Consentimiento-anestesia-${c.paciente.numeroExpediente}.pdf`,
    subidoPorId: c.user.id,
  });
  await registrar(c.user, documentoId, c.paciente.id, "CONSENTIMIENTO_ANESTESIA");
}

// ── 6. Hoja de autorización quirúrgica (firmada en tableta) ───────────

const autQxSchema = z.object({
  anestesiaPlaneada: z.string().min(1, "Anestesia planeada requerida"),
  tipoOperacion: z.string().min(1, "Tipo de operación requerido"),
  sangre: z.string().optional(),
  firmaPaciente: firmaSchema,
  firmaResponsable: firmaSchema,
  firmaTestigo: firmaSchema,
  nombreResponsable: z.string().optional(),
  nombreTestigo: z.string().optional(),
});

export async function generarAutorizacionQx(qxId: string, _p: ActionState, fd: FormData): Promise<ActionState | void> {
  let c;
  try {
    c = await contextoQx(qxId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = autQxSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (!d.firmaPaciente) return { error: "La firma del paciente es obligatoria (capture en la tableta)." };

  const fechaCx = c.qx.fechaCirugiaProgramada;
  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(AutorizacionQxPdf, {
      d: {
        est: c.est,
        paciente: pacientePdf(c.paciente),
        medico: c.medico,
        servicio: c.qx.asignacion.especialidad.nombre,
        diagnosticoPre: c.qx.notaPre?.diagnosticoPreoperatorio ?? "—",
        operacionProyectada: c.qx.notaPre?.planQuirurgico ?? "—",
        tipoOperacion: d.tipoOperacion,
        anestesiaPlaneada: d.anestesiaPlaneada,
        sangre: d.sangre,
        fechaCirugia: fechaCx ? fmtFecha(fechaCx) : null,
        horaCirugia: fechaCx
          ? fechaCx.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" })
          : null,
        quirofano: c.qx.quirofanoSede,
        registro: c.qx.notaPost
          ? {
              diagnosticoPost: c.qx.notaPost.diagnosticoPostoperatorio,
              anestesiaAdministrada: null,
              examenHistopatologico: c.qx.notaPost.envioPiezasPatologia,
              cirugiaEfectuada: c.qx.notaPost.operacionRealizada,
            }
          : null,
        firmas: {
          paciente: d.firmaPaciente,
          responsable: d.firmaResponsable,
          testigo: d.firmaTestigo,
          nombreResponsable: d.nombreResponsable,
          nombreTestigo: d.nombreTestigo,
        },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: c.paciente.id,
    tipo: "AUTORIZACION_QX",
    nombreArchivo: `Autorizacion-quirurgica-${c.paciente.numeroExpediente}.pdf`,
    subidoPorId: c.user.id,
  });
  await registrar(c.user, documentoId, c.paciente.id, "AUTORIZACION_QX");
}

// ── 7. Ficha de identificación (hoja oficial 2) ───────────────────────
// La llena recepción con apoyo del paciente; firman paciente, médico y familiar.

const fichaSchema = z.object({
  diagnostico: z.string().optional(),
  hora: z.string().optional(),
  nombreResponsable: z.string().optional(),
  parentescoResponsable: z.string().optional(),
  domicilioResponsable: z.string().optional(),
  telefonoResponsable: z.string().optional(),
  coloniaResponsable: z.string().optional(),
  cpResponsable: z.string().optional(),
  firmaPaciente: firmaSchema,
  firmaMedico: firmaSchema,
  firmaFamiliar: firmaSchema,
});

export async function generarFichaIdentificacion(
  pacienteId: string,
  _p: ActionState,
  fd: FormData,
): Promise<ActionState | void> {
  let ctx;
  try {
    ctx = await contexto(pacienteId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = fichaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const p = ctx.paciente;

  // Médico tratante: la asignación activa más reciente del paciente.
  const asignacion = await db.asignacion.findFirst({
    where: { pacienteId, estado: "ACTIVA" },
    include: { doctor: { include: { usuario: true } }, especialidad: true },
    orderBy: { fechaAsignacion: "desc" },
  });
  // Diagnóstico: el capturado en el formulario o el de la última hoja cerrada.
  const hoja = await db.hojaPrimerLlenado.findFirst({
    where: { pacienteId, estado: "CERRADA" },
    orderBy: { version: "desc" },
    select: { motivoConsulta: true },
  });

  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(FichaIdentificacionPdf, {
      d: {
        est: ctx.est,
        paciente: { ...pacientePdf(p), colonia: p.colonia, cp: p.cp, estadoCivil: p.estadoCivil },
        diagnostico: d.diagnostico || hoja?.motivoConsulta || null,
        hora: d.hora || fmtHora(new Date()),
        responsable: {
          nombre: d.nombreResponsable || p.contactoEmergenciaNombre,
          parentesco: d.parentescoResponsable || p.contactoEmergenciaParentesco,
          domicilio: d.domicilioResponsable,
          telefono: d.telefonoResponsable || p.contactoEmergenciaTelefono,
          colonia: d.coloniaResponsable,
          cp: d.cpResponsable,
        },
        medico: asignacion
          ? {
              nombre: asignacion.doctor.usuario.nombreCompleto,
              consultorio: asignacion.doctor.consultorio,
              telefono: asignacion.doctor.telefono,
            }
          : null,
        firmas: { paciente: d.firmaPaciente, medico: d.firmaMedico, familiar: d.firmaFamiliar },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId,
    tipo: "FICHA_IDENTIFICACION",
    nombreArchivo: `Ficha-identificacion-${p.numeroExpediente}.pdf`,
    subidoPorId: ctx.user.id,
  });
  await registrar(ctx.user, documentoId, pacienteId, "FICHA_IDENTIFICACION");
}

// ── 8. Descripción del procedimiento quirúrgico (hoja oficial 6) ───────
// Reproduce las nueve secciones numeradas del formato impreso a partir de la
// nota postoperatoria ya capturada.

export async function generarDescripcionQx(qxId: string): Promise<ActionState | void> {
  let c;
  try {
    c = await contextoQx(qxId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const post = c.qx.notaPost;
  if (!post) return { error: "Capture la nota postoperatoria antes de generar la descripción del procedimiento." };

  const anestesia = await db.registroAnestesico.findUnique({
    where: { expedienteQxId: qxId },
    include: { anestesiologoUsuario: { select: { nombreCompleto: true } } },
  });

  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(DescripcionQxPdf, {
      d: {
        est: c.est,
        paciente: pacientePdf(c.paciente),
        medico: c.medico,
        tecnica: post.descripcionTecnica,
        hallazgos: post.hallazgos,
        complicaciones: post.incidentesAccidentes,
        incidentes: post.incidentesAccidentes,
        estadoPostPlan: [post.estadoPostquirurgico, post.planManejo].filter(Boolean).join(" · ") || null,
        pronostico: post.pronostico,
        sangradoGasas: [post.cuantificacionSangrado, post.conteoGasas].filter(Boolean).join(" · ") || null,
        patologia: post.envioPiezasPatologia,
        equipo: {
          cirujano: c.medico.nombre,
          anestesiologo: anestesia?.anestesiologoUsuario.nombreCompleto ?? null,
          // El resto del equipo va en el campo libre de la nota postoperatoria.
          circulante: post.equipoQuirurgico,
          primerAyudante: null,
          instrumentista: null,
          segundoAyudante: null,
        },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: c.paciente.id,
    tipo: "DESCRIPCION_QX",
    nombreArchivo: `Descripcion-procedimiento-${c.paciente.numeroExpediente}.pdf`,
    subidoPorId: c.user.id,
  });
  await registrar(c.user, documentoId, c.paciente.id, "DESCRIPCION_QX");
}
