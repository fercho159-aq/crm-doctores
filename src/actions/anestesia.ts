"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import React from "react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, AuthzError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { guardarFormatoPdf } from "@/lib/pdf";
import { cargarEstablecimiento, pacientePdf, fmt, fmtFecha, dec } from "@/lib/formatos";
import {
  ValoracionPreanestesicaPdf,
  RegistroAnestesicoPdf,
  NotaPostanestesicaPdf,
  type AnestesiologoPdf,
  type LecturaTransanestesica,
} from "@/pdf/anestesia";
import {
  ALDRETE_CRITERIOS,
  ALDRETE_TIEMPOS,
  EGRESOS,
  INGRESOS,
  EXPLORACION_SEGMENTOS,
  LABORATORIO_CAMPOS,
  TIEMPOS_TRANSANESTESICOS,
} from "@/lib/escalasAnestesia";
import type { ActionState } from "./auth";

// Hojas oficiales 15-20. Sólo el anestesiólogo (o el administrador, en lectura)
// tiene acceso; al firmar, el registro queda inmutable por trigger.

const texto = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v.length ? v : null;
};
const entero = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};
const decimalOpt = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? new Prisma.Decimal(n) : null;
};
const booleano = (fd: FormData, k: string) => {
  const v = fd.get(k);
  if (v === null) return null;
  return v === "true" || v === "on" || v === "Sí" || v === "1";
};
const lista = (fd: FormData, k: string) => fd.getAll(k).map(String).filter(Boolean);
/** Agrupa los campos `prefijo.sufijo` del formulario en un objeto para columnas Json. */
const grupo = (fd: FormData, prefijo: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (!k.startsWith(`${prefijo}.`)) continue;
    const val = String(v).trim();
    if (val) out[k.slice(prefijo.length + 1)] = val;
  }
  return out;
};
/**
 * Prisma distingue `null` de JSON nulo: para vaciar una columna Json anulable
 * hay que enviar `Prisma.DbNull`, no `null`.
 */
const json = (v: unknown) => (v === null || v === undefined ? Prisma.DbNull : (v as Prisma.InputJsonValue));
const orNull = (o: Record<string, unknown>) => (Object.keys(o).length ? o : null);

async function contextoQx(qxId: string, escritura: boolean) {
  const user = escritura ? await requireRole("ANESTESIOLOGO") : await requireRole("ANESTESIOLOGO", "ADMIN", "DOCTOR");
  const qx = await db.expedienteQuirurgico.findUnique({
    where: { id: qxId },
    include: {
      paciente: true,
      notaPre: true,
      asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } },
    },
  });
  if (!qx || qx.paciente.workspaceId !== user.workspaceId) throw new AuthzError("Expediente quirúrgico no encontrado.");
  return { user, qx };
}

/** Rúbrica y cédula del anestesiólogo que firma la hoja. */
async function anestesiologoPdf(usuarioId: string): Promise<AnestesiologoPdf> {
  const u = await db.usuario.findUniqueOrThrow({
    where: { id: usuarioId },
    select: { nombreCompleto: true, doctor: { select: { cedulaProfesional: true, firmaDigitalizada: true } } },
  });
  return {
    nombre: u.nombreCompleto,
    cedula: u.doctor?.cedulaProfesional ?? null,
    firma: u.doctor?.firmaDigitalizada ?? null,
  };
}

// ═══════════ Valoración preanestésica (hojas 15-16) ═══════════

export async function guardarValoracionPre(
  qxId: string,
  firmar: boolean,
  _p: ActionState,
  fd: FormData,
): Promise<ActionState> {
  let c;
  try {
    c = await contextoQx(qxId, true);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const existente = await db.valoracionPreanestesica.findUnique({ where: { expedienteQxId: qxId } });
  if (existente && existente.estado !== "BORRADOR") {
    return { error: "La valoración preanestésica ya está firmada (inmutable)." };
  }

  const peso = decimalOpt(fd, "pesoKg");
  const talla = decimalOpt(fd, "tallaCm");
  const imc =
    peso && talla && Number(talla) > 0
      ? new Prisma.Decimal((Number(peso) / Math.pow(Number(talla) / 100, 2)).toFixed(2))
      : null;

  if (firmar) {
    const faltan = [
      [!texto(fd, "diagnosticoPrequirurgico"), "diagnóstico prequirúrgico"],
      [!texto(fd, "cirugiaPlaneada"), "cirugía planeada"],
      [!texto(fd, "asa"), "clasificación ASA"],
      [lista(fd, "planAnestesico").length === 0, "plan anestésico"],
    ].filter(([x]) => x).map(([, n]) => n);
    if (faltan.length) return { error: `Antes de firmar faltan: ${faltan.join(", ")}.` };
  }

  const datos = {
    pacienteId: c.qx.pacienteId,
    habitacion: texto(fd, "habitacion"),
    servicio: texto(fd, "servicio") ?? c.qx.asignacion.especialidad.nombre,
    folio: texto(fd, "folio"),
    tipoPago: texto(fd, "tipoPago"),
    fechaIngreso: texto(fd, "fechaIngreso") ? new Date(String(fd.get("fechaIngreso"))) : null,
    horaIngreso: texto(fd, "horaIngreso"),
    diagnosticoPrequirurgico: texto(fd, "diagnosticoPrequirurgico") ?? c.qx.notaPre?.diagnosticoPreoperatorio ?? null,
    cirugiaPlaneada: texto(fd, "cirugiaPlaneada") ?? c.qx.notaPre?.planQuirurgico ?? null,
    cirujano: texto(fd, "cirujano") ?? c.qx.asignacion.doctor.usuario.nombreCompleto,
    anestesiologo: texto(fd, "anestesiologo") ?? c.user.nombreCompleto,
    tipoCirugia: json(lista(fd, "tipoCirugia")),
    antecedentesImportancia: texto(fd, "antecedentesImportancia"),
    pesoKg: peso,
    tallaCm: talla,
    imc,
    temperatura: decimalOpt(fd, "temperatura"),
    ta: texto(fd, "ta"),
    fr: entero(fd, "fr"),
    fc: entero(fd, "fc"),
    spo2: entero(fd, "spo2"),
    ...Object.fromEntries(EXPLORACION_SEGMENTOS.map((s) => [s.campo, texto(fd, s.campo)])),
    labFecha: texto(fd, "labFecha") ? new Date(String(fd.get("labFecha"))) : null,
    grupoSanguineo: texto(fd, "grupoSanguineo"),
    factorRh: texto(fd, "factorRh"),
    ...Object.fromEntries(LABORATORIO_CAMPOS.map((l) => [l.campo, texto(fd, l.campo)])),
    labOtros: texto(fd, "labOtros"),
    ecg: texto(fd, "ecg"),
    rayosX: texto(fd, "rayosX"),
    ultrasonido: texto(fd, "ultrasonido"),
    gabineteOtros: texto(fd, "gabineteOtros"),
    factoresRiesgo: json({ marcadas: lista(fd, "factoresRiesgo"), especificar: texto(fd, "factoresRiesgoEspecificar") }),
    asa: texto(fd, "asa"),
    anginaCanadiense: texto(fd, "anginaCanadiense"),
    goldman: json(lista(fd, "goldman")),
    goldmanPuntos: entero(fd, "goldmanPuntos"),
    goldmanClase: texto(fd, "goldmanClase"),
    trombolitico: json({
      menores: lista(fd, "trombMenores"),
      intermedios: lista(fd, "trombIntermedios"),
      mayores: lista(fd, "trombMayores"),
    }),
    predictores: json({
      menores: lista(fd, "predMenores"),
      intermedios: lista(fd, "predIntermedios"),
      mayores: lista(fd, "predMayores"),
    }),
    neurologico: json({
      pupilas: lista(fd, "pupilas"),
      ojos: entero(fd, "glasgowOjos"),
      motor: entero(fd, "glasgowMotor"),
      verbal: entero(fd, "glasgowVerbal"),
    }),
    viaAerea: json({
      ventilacionDificil: lista(fd, "ventilacionDificil"),
      mallampati: texto(fd, "mallampati"),
      apertura: texto(fd, "apertura"),
      tiromentoniana: texto(fd, "tiromentoniana"),
      subluxacion: texto(fd, "subluxacion"),
      extension: texto(fd, "extension"),
    }),
    planAnestesico: json(lista(fd, "planAnestesico")),
    fechaElaboracion: new Date(),
    anestesiologoId: c.user.id,
    firmaAnestesiologo: texto(fd, "firmaAnestesiologo"),
    ...(firmar ? { estado: "FIRMADA" as const, fechaFirma: new Date() } : {}),
  };

  const v = existente
    ? await db.valoracionPreanestesica.update({ where: { id: existente.id }, data: datos })
    : await db.valoracionPreanestesica.create({ data: { expedienteQxId: qxId, ...datos } });

  await audit({
    usuarioId: c.user.id, rol: c.user.rol, accion: firmar ? "FIRMAR" : "GUARDAR_BORRADOR",
    entidad: "valoracion_preanestesica", entidadId: v.id, pacienteId: c.qx.pacienteId,
  });
  revalidatePath(`/anestesiologia/${qxId}`);
  return { ok: true };
}

export async function generarValoracionPrePdf(qxId: string): Promise<ActionState | void> {
  let c;
  try {
    c = await contextoQx(qxId, false);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const v = await db.valoracionPreanestesica.findUnique({ where: { expedienteQxId: qxId } });
  if (!v) return { error: "Aún no se ha capturado la valoración preanestésica." };
  const est = await cargarEstablecimiento();

  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(ValoracionPreanestesicaPdf, {
      d: {
        est,
        paciente: pacientePdf(c.qx.paciente),
        anestesiologo: await anestesiologoPdf(v.anestesiologoId),
        v: {
          habitacion: v.habitacion,
          servicio: v.servicio,
          folio: v.folio,
          tipoPago: v.tipoPago,
          fechaIngreso: v.fechaIngreso ? fmtFecha(v.fechaIngreso) : null,
          horaIngreso: v.horaIngreso,
          diagnosticoPrequirurgico: v.diagnosticoPrequirurgico,
          cirugiaPlaneada: v.cirugiaPlaneada,
          cirujano: v.cirujano,
          anestesiologo: v.anestesiologo,
          tipoCirugia: v.tipoCirugia as string[] | null,
          antecedentesImportancia: v.antecedentesImportancia,
          pesoKg: dec(v.pesoKg),
          tallaCm: dec(v.tallaCm),
          imc: dec(v.imc),
          temperatura: dec(v.temperatura),
          ta: v.ta,
          fr: v.fr === null ? null : String(v.fr),
          fc: v.fc === null ? null : String(v.fc),
          spo2: v.spo2 === null ? null : String(v.spo2),
          exploracion: {
            exCabeza: v.exCabeza,
            exCuello: v.exCuello,
            exRespiratorio: v.exRespiratorio,
            exCardiovascular: v.exCardiovascular,
            exGastrointestinal: v.exGastrointestinal,
            exGenitourinario: v.exGenitourinario,
          },
          labFecha: v.labFecha ? fmtFecha(v.labFecha) : null,
          grupoSanguineo: v.grupoSanguineo,
          factorRh: v.factorRh,
          laboratorio: {
            hemoglobina: v.hemoglobina, hematocrito: v.hematocrito, plaquetas: v.plaquetas,
            leucocitos: v.leucocitos, tp: v.tp, tpt: v.tpt, tt: v.tt, glucosa: v.glucosa,
            creatinina: v.creatinina, urea: v.urea, sodio: v.sodio, potasio: v.potasio,
            cloro: v.cloro, calcio: v.calcio,
          },
          labOtros: v.labOtros,
          ecg: v.ecg,
          rayosX: v.rayosX,
          ultrasonido: v.ultrasonido,
          gabineteOtros: v.gabineteOtros,
          factoresRiesgo: v.factoresRiesgo as { marcadas?: string[]; especificar?: string | null } | null,
          asa: v.asa,
          anginaCanadiense: v.anginaCanadiense,
          goldman: v.goldman as string[] | null,
          predictores: v.predictores as { menores?: string[]; intermedios?: string[]; mayores?: string[] } | null,
          trombolitico: v.trombolitico as { menores?: string[]; intermedios?: string[]; mayores?: string[] } | null,
          neurologico: v.neurologico as { pupilas?: string[]; ojos?: number; motor?: number; verbal?: number } | null,
          viaAerea: v.viaAerea as {
            ventilacionDificil?: string[];
            mallampati?: string | null;
            apertura?: string | null;
            tiromentoniana?: string | null;
            subluxacion?: string | null;
            extension?: string | null;
          } | null,
          planAnestesico: v.planAnestesico as string[] | null,
          fechaElaboracion: v.fechaElaboracion ? fmt(v.fechaElaboracion) : null,
        },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: c.qx.pacienteId,
    tipo: "VALORACION_PREANESTESICA",
    nombreArchivo: `Valoracion-preanestesica-${c.qx.paciente.numeroExpediente}.pdf`,
    subidoPorId: c.user.id,
  });
  await audit({
    usuarioId: c.user.id, rol: c.user.rol, accion: "GENERAR_FORMATO", entidad: "documento",
    entidadId: documentoId, pacienteId: c.qx.pacienteId, datosDespues: { tipo: "VALORACION_PREANESTESICA" },
  });
  redirect(`/api/documentos/${documentoId}`);
}

// ═══════════ Registro anestésico y transanestésico (hojas 17-18) ═══════════

export async function guardarRegistroAnestesico(
  qxId: string,
  firmar: boolean,
  _p: ActionState,
  fd: FormData,
): Promise<ActionState> {
  let c;
  try {
    c = await contextoQx(qxId, true);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const existente = await db.registroAnestesico.findUnique({ where: { expedienteQxId: qxId } });
  if (existente && existente.estado !== "BORRADOR") {
    return { error: "El registro anestésico ya está firmado (inmutable)." };
  }
  if (firmar && !texto(fd, "tecnicaAnestesica")) {
    return { error: "Indique la técnica anestésica antes de firmar." };
  }

  const datos = {
    pacienteId: c.qx.pacienteId,
    evalFecha: texto(fd, "evalFecha") ? new Date(String(fd.get("evalFecha"))) : null,
    evalHora: texto(fd, "evalHora"),
    consentimientoAnestesia: booleano(fd, "consentimientoAnestesia"),
    identificacionCorroborada: booleano(fd, "identificacionCorroborada"),
    verificacionEquipo: json(lista(fd, "verificacionEquipo")),
    signosBasales: json(orNull(grupo(fd, "signosBasales"))),
    medicacionPreanestesica: json(leerMedicacion(fd)),
    evalObservaciones: texto(fd, "evalObservaciones"),
    horasAyuno: texto(fd, "horasAyuno"),
    premedicacion: booleano(fd, "premedicacion"),
    premedicacionDetalle: texto(fd, "premedicacionDetalle"),
    accesoVenoso: booleano(fd, "accesoVenoso"),
    accesoSitio: texto(fd, "accesoSitio"),
    calibreCateter: texto(fd, "calibreCateter"),
    posicionPaciente: texto(fd, "posicionPaciente"),
    posicionBrazos: texto(fd, "posicionBrazos"),
    proteccionOjos: booleano(fd, "proteccionOjos"),
    proteccionProminencias: booleano(fd, "proteccionProminencias"),
    torniquete: booleano(fd, "torniquete"),
    torniqueteSitio: texto(fd, "torniqueteSitio"),
    torniqueteInicia: texto(fd, "torniqueteInicia"),
    torniqueteTermina: texto(fd, "torniqueteTermina"),
    tecnicaAnestesica: texto(fd, "tecnicaAnestesica"),
    anestesiaLocal: json(orNull(grupo(fd, "local"))),
    anestesiaRegional: json(orNull(grupo(fd, "regional"))),
    anestesiaGeneral: json(orNull(grupo(fd, "general"))),
    casoObstetrico: json(orNull(grupo(fd, "obstetrico"))),
    agentes: texto(fd, "agentes"),
    tiempos: json(
      orNull(
        Object.fromEntries(
          TIEMPOS_TRANSANESTESICOS.map((t) => [t.clave, texto(fd, `tiempo.${t.clave}`)]).filter(([, v]) => v),
        ),
      ),
    ),
    tipoVentilacion: texto(fd, "tipoVentilacion"),
    egresos: json(orNull(balance(fd, "egreso", EGRESOS.map((e) => e.campo)))),
    ingresos: json(orNull(balance(fd, "ingreso", INGRESOS.map((e) => e.campo)))),
    balanceHidrico: texto(fd, "balanceHidrico"),
    aldreteFinal: entero(fd, "aldreteFinal"),
    pasaA: texto(fd, "pasaA"),
    anestesiologoId: c.user.id,
    firmaAnestesiologo: texto(fd, "firmaAnestesiologo"),
  };

  const lecturas = leerLecturas(fd);
  const farmacos = leerFarmacos(fd);

  // La firma se aplica al final: el trigger de la base rechaza escribir
  // lecturas y fármacos de un registro que ya está firmado.
  const r = await db.$transaction(async (tx) => {
    const reg = existente
      ? await tx.registroAnestesico.update({ where: { id: existente.id }, data: datos })
      : await tx.registroAnestesico.create({ data: { expedienteQxId: qxId, ...datos } });
    // La cuadrícula se reemplaza completa: es una sola captura por hoja.
    await tx.transanestesicoLectura.deleteMany({ where: { registroId: reg.id } });
    await tx.transanestesicoFarmaco.deleteMany({ where: { registroId: reg.id } });
    if (lecturas.length) {
      await tx.transanestesicoLectura.createMany({ data: lecturas.map((l) => ({ registroId: reg.id, ...l })) });
    }
    if (farmacos.length) {
      await tx.transanestesicoFarmaco.createMany({ data: farmacos.map((x) => ({ registroId: reg.id, ...x })) });
    }
    if (!firmar) return reg;
    return tx.registroAnestesico.update({
      where: { id: reg.id },
      data: { estado: "FIRMADA", fechaFirma: new Date() },
    });
  });

  await audit({
    usuarioId: c.user.id, rol: c.user.rol, accion: firmar ? "FIRMAR" : "GUARDAR_BORRADOR",
    entidad: "registro_anestesico", entidadId: r.id, pacienteId: c.qx.pacienteId,
    datosDespues: { lecturas: lecturas.length, farmacos: farmacos.length },
  });
  revalidatePath(`/anestesiologia/${qxId}`);
  return { ok: true };
}

/** Suma los renglones de un balance y añade el total, como el pie del formato. */
function balance(fd: FormData, prefijo: string, campos: readonly string[]) {
  const out: Record<string, string> = {};
  let total = 0;
  for (const campo of campos) {
    const v = String(fd.get(`${prefijo}.${campo}`) ?? "").trim();
    if (!v) continue;
    out[campo] = v;
    const n = Number(v);
    if (Number.isFinite(n)) total += n;
  }
  if (Object.keys(out).length) out.total = String(total);
  return out;
}

function leerMedicacion(fd: FormData) {
  const meds = fd.getAll("mp_medicamento").map(String);
  const dosis = fd.getAll("mp_dosis").map(String);
  const vias = fd.getAll("mp_via").map(String);
  const fechas = fd.getAll("mp_fecha").map(String);
  const horas = fd.getAll("mp_hora").map(String);
  const efectos = fd.getAll("mp_efecto").map(String);
  const filas = meds
    .map((medicamento, i) => ({
      medicamento: medicamento.trim(),
      dosis: (dosis[i] ?? "").trim(),
      via: (vias[i] ?? "").trim(),
      fecha: (fechas[i] ?? "").trim(),
      hora: (horas[i] ?? "").trim(),
      efecto: (efectos[i] ?? "").trim(),
    }))
    .filter((m) => m.medicamento.length > 0);
  return filas.length ? filas : null;
}

function leerFarmacos(fd: FormData) {
  const nombres = fd.getAll("fa_nombre").map(String);
  const dosis = fd.getAll("fa_dosis").map(String);
  const vias = fd.getAll("fa_via").map(String);
  return nombres
    .map((nombre, i) => ({
      orden: i + 1,
      nombre: nombre.trim(),
      dosis: (dosis[i] ?? "").trim() || null,
      via: (vias[i] ?? "").trim() || null,
    }))
    .filter((x) => x.nombre.length > 0);
}

/** Columnas de la cuadrícula transanestésica; se descartan las totalmente vacías. */
function leerLecturas(fd: FormData) {
  const minutos = fd.getAll("lec_minuto").map(String);
  const campos = ["hora", "taSistolica", "taDiastolica", "fc", "fr", "temperatura", "spo2", "etco2", "pvcPam", "bis", "otros"];
  const valores: Record<string, string[]> = {};
  for (const c of campos) valores[c] = fd.getAll(`lec_${c}`).map(String);

  const vistos = new Set<number>();
  const out: {
    minuto: number;
    hora: string | null;
    taSistolica: number | null;
    taDiastolica: number | null;
    fc: number | null;
    fr: number | null;
    temperatura: Prisma.Decimal | null;
    spo2: number | null;
    etco2: string | null;
    pvcPam: string | null;
    bis: string | null;
    otros: string | null;
  }[] = [];

  minutos.forEach((m, i) => {
    const minuto = Number.parseInt(m, 10);
    if (!Number.isFinite(minuto) || vistos.has(minuto)) return;
    const val = (c: string) => (valores[c][i] ?? "").trim();
    const int = (c: string) => {
      const n = Number.parseInt(val(c), 10);
      return Number.isFinite(n) ? n : null;
    };
    const fila = {
      minuto,
      hora: val("hora") || null,
      taSistolica: int("taSistolica"),
      taDiastolica: int("taDiastolica"),
      fc: int("fc"),
      fr: int("fr"),
      temperatura: val("temperatura") && Number.isFinite(Number(val("temperatura")))
        ? new Prisma.Decimal(val("temperatura"))
        : null,
      spo2: int("spo2"),
      etco2: val("etco2") || null,
      pvcPam: val("pvcPam") || null,
      bis: val("bis") || null,
      otros: val("otros") || null,
    };
    const tieneDatos = Object.entries(fila).some(([k, v]) => k !== "minuto" && v !== null);
    if (!tieneDatos) return;
    vistos.add(minuto);
    out.push(fila);
  });
  return out.sort((a, b) => a.minuto - b.minuto);
}

export async function generarRegistroAnestesicoPdf(qxId: string): Promise<ActionState | void> {
  let c;
  try {
    c = await contextoQx(qxId, false);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const r = await db.registroAnestesico.findUnique({
    where: { expedienteQxId: qxId },
    include: {
      lecturas: { orderBy: { minuto: "asc" } },
      farmacos: { orderBy: { orden: "asc" } },
    },
  });
  if (!r) return { error: "Aún no se ha capturado el registro anestésico." };
  const est = await cargarEstablecimiento();

  const lecturas: LecturaTransanestesica[] = r.lecturas.map((l) => ({
    minuto: l.minuto,
    hora: l.hora,
    taSistolica: l.taSistolica,
    taDiastolica: l.taDiastolica,
    fc: l.fc,
    fr: l.fr,
    temperatura: l.temperatura === null ? null : Number(l.temperatura),
    spo2: l.spo2,
    etco2: l.etco2,
    pvcPam: l.pvcPam,
    bis: l.bis,
    otros: l.otros,
  }));

  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(RegistroAnestesicoPdf, {
      d: {
        est,
        paciente: pacientePdf(c.qx.paciente),
        anestesiologo: await anestesiologoPdf(r.anestesiologoId),
        r: {
          evalFecha: r.evalFecha ? fmtFecha(r.evalFecha) : null,
          evalHora: r.evalHora,
          consentimientoAnestesia: r.consentimientoAnestesia,
          identificacionCorroborada: r.identificacionCorroborada,
          verificacionEquipo: r.verificacionEquipo as string[] | null,
          signosBasales: r.signosBasales as Record<string, string> | null,
          medicacionPreanestesica: r.medicacionPreanestesica as
            | { medicamento: string; dosis?: string; via?: string; fecha?: string; hora?: string; efecto?: string }[]
            | null,
          evalObservaciones: r.evalObservaciones,
          horasAyuno: r.horasAyuno,
          premedicacion: r.premedicacion,
          premedicacionDetalle: r.premedicacionDetalle,
          accesoVenoso: r.accesoVenoso,
          accesoSitio: r.accesoSitio,
          calibreCateter: r.calibreCateter,
          posicionPaciente: r.posicionPaciente,
          posicionBrazos: r.posicionBrazos,
          proteccionOjos: r.proteccionOjos,
          proteccionProminencias: r.proteccionProminencias,
          torniquete: r.torniquete,
          torniqueteSitio: r.torniqueteSitio,
          torniqueteInicia: r.torniqueteInicia,
          torniqueteTermina: r.torniqueteTermina,
          tecnicaAnestesica: r.tecnicaAnestesica,
          anestesiaLocal: r.anestesiaLocal as Record<string, string | null> | null,
          anestesiaRegional: r.anestesiaRegional as Record<string, string | null> | null,
          anestesiaGeneral: r.anestesiaGeneral as Record<string, string | null> | null,
          casoObstetrico: r.casoObstetrico as Record<string, string | null> | null,
          agentes: r.agentes,
          tiempos: r.tiempos as Record<string, string | null> | null,
          tipoVentilacion: r.tipoVentilacion,
          egresos: r.egresos as Record<string, string | null> | null,
          ingresos: r.ingresos as Record<string, string | null> | null,
          balanceHidrico: r.balanceHidrico,
          aldreteFinal: r.aldreteFinal,
          pasaA: r.pasaA,
          lecturas,
          farmacos: r.farmacos.map((x) => ({ nombre: x.nombre, dosis: x.dosis, via: x.via })),
        },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: c.qx.pacienteId,
    tipo: "REGISTRO_ANESTESICO",
    nombreArchivo: `Registro-anestesico-${c.qx.paciente.numeroExpediente}.pdf`,
    subidoPorId: c.user.id,
  });
  await audit({
    usuarioId: c.user.id, rol: c.user.rol, accion: "GENERAR_FORMATO", entidad: "documento",
    entidadId: documentoId, pacienteId: c.qx.pacienteId, datosDespues: { tipo: "REGISTRO_ANESTESICO" },
  });
  redirect(`/api/documentos/${documentoId}`);
}

// ═══════════ Nota post-anestésica (hoja 19) ═══════════

export async function guardarNotaPostanestesica(
  qxId: string,
  firmar: boolean,
  _p: ActionState,
  fd: FormData,
): Promise<ActionState> {
  let c;
  try {
    c = await contextoQx(qxId, true);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const existente = await db.notaPostanestesica.findUnique({ where: { expedienteQxId: qxId } });
  if (existente && existente.estado !== "BORRADOR") {
    return { error: "La nota post-anestésica ya está firmada (inmutable)." };
  }
  if (firmar) {
    const faltan = [
      [!texto(fd, "nota"), "nota post-anestésica"],
      [!texto(fd, "pasaA"), "destino del paciente"],
    ].filter(([x]) => x).map(([, n]) => n);
    if (faltan.length) return { error: `Antes de firmar faltan: ${faltan.join(", ")}.` };
  }

  // Aldrete: una columna por minuto evaluado, cada una con sus cinco criterios.
  const aldrete: Record<string, Record<string, number>> = {};
  for (const min of ALDRETE_TIEMPOS) {
    const col: Record<string, number> = {};
    for (const crit of ALDRETE_CRITERIOS) {
      const v = entero(fd, `aldrete.${min}.${crit.campo}`);
      if (v !== null) col[crit.campo] = v;
    }
    if (Object.keys(col).length) aldrete[String(min)] = col;
  }

  const datos = {
    pacienteId: c.qx.pacienteId,
    aldrete: json(Object.keys(aldrete).length ? aldrete : null),
    ramsay: entero(fd, "ramsay"),
    bromage: entero(fd, "bromage"),
    nota: texto(fd, "nota"),
    planOxigeno: texto(fd, "planOxigeno"),
    planSolucionesIV: texto(fd, "planSolucionesIV"),
    planMedicamentos: texto(fd, "planMedicamentos"),
    planComponentesSanguineos: texto(fd, "planComponentesSanguineos"),
    planManejoDolor: texto(fd, "planManejoDolor"),
    motivoEgreso: texto(fd, "motivoEgreso"),
    pasaA: texto(fd, "pasaA"),
    anestesiologoId: c.user.id,
    firmaAnestesiologo: texto(fd, "firmaAnestesiologo"),
    ...(firmar ? { estado: "FIRMADA" as const, fechaFirma: new Date() } : {}),
  };

  const n = existente
    ? await db.notaPostanestesica.update({ where: { id: existente.id }, data: datos })
    : await db.notaPostanestesica.create({ data: { expedienteQxId: qxId, ...datos } });

  await audit({
    usuarioId: c.user.id, rol: c.user.rol, accion: firmar ? "FIRMAR" : "GUARDAR_BORRADOR",
    entidad: "nota_postanestesica", entidadId: n.id, pacienteId: c.qx.pacienteId,
  });
  revalidatePath(`/anestesiologia/${qxId}`);
  return { ok: true };
}

export async function generarNotaPostanestesicaPdf(qxId: string): Promise<ActionState | void> {
  let c;
  try {
    c = await contextoQx(qxId, false);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const n = await db.notaPostanestesica.findUnique({ where: { expedienteQxId: qxId } });
  if (!n) return { error: "Aún no se ha capturado la nota post-anestésica." };
  const est = await cargarEstablecimiento();

  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(NotaPostanestesicaPdf, {
      d: {
        est,
        paciente: pacientePdf(c.qx.paciente),
        anestesiologo: await anestesiologoPdf(n.anestesiologoId),
        n: {
          aldrete: n.aldrete as Record<string, Record<string, number | null>> | null,
          ramsay: n.ramsay,
          bromage: n.bromage,
          nota: n.nota,
          planOxigeno: n.planOxigeno,
          planSolucionesIV: n.planSolucionesIV,
          planMedicamentos: n.planMedicamentos,
          planComponentesSanguineos: n.planComponentesSanguineos,
          planManejoDolor: n.planManejoDolor,
          motivoEgreso: n.motivoEgreso,
          pasaA: n.pasaA,
          fechaHora: fmt(n.fechaHora),
        },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: c.qx.pacienteId,
    tipo: "NOTA_POSTANESTESICA",
    nombreArchivo: `Nota-postanestesica-${c.qx.paciente.numeroExpediente}.pdf`,
    subidoPorId: c.user.id,
  });
  await audit({
    usuarioId: c.user.id, rol: c.user.rol, accion: "GENERAR_FORMATO", entidad: "documento",
    entidadId: documentoId, pacienteId: c.qx.pacienteId, datosDespues: { tipo: "NOTA_POSTANESTESICA" },
  });
  redirect(`/api/documentos/${documentoId}`);
}
