"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, assertAsignacionPropia, AuthzError } from "@/lib/authz";
import { siguienteFolio } from "@/lib/folio";
import { audit } from "@/lib/audit";
import { encolarReceta } from "@/lib/email";
import { generarPdfReceta, edadDe, fechaLarga } from "@/lib/pdf";
import type { ActionState } from "./auth";

const partidaSchema = z.object({
  medicamento: z.string().min(2, "Nombre del medicamento requerido"),
  dosis: z.string().min(1, "Dosis requerida"),
  viaAdministracion: z.string().min(1, "Vía requerida"),
  frecuencia: z.string().min(1, "Frecuencia requerida"),
  duracion: z.string().min(1, "Duración requerida"),
  presentacion: z.string().optional(),
  cantidad: z.string().optional(),
  indicaciones: z.string().optional(),
});

const consultaSchema = z.object({
  // Signos vitales
  pesoKg: z.coerce.number().positive().optional(),
  tallaCm: z.coerce.number().positive().optional(),
  taSistolica: z.coerce.number().positive().optional(),
  taDiastolica: z.coerce.number().positive().optional(),
  fc: z.coerce.number().positive().optional(),
  temperatura: z.coerce.number().positive().optional(),
  spo2: z.coerce.number().positive().optional(),
  glucosa: z.coerce.number().positive().optional(),
  // Diagnóstico
  diagnostico: z.string().min(3, "Escriba el diagnóstico"),
  // Estudios
  estudios: z.string().optional(),
  // Indicaciones
  indicacionesGenerales: z.string().optional(),
  proximaCita: z.string().optional(),
  // Medicamentos
  partidas: z.array(partidaSchema).min(1, "Agregue al menos un medicamento"),
});

export async function emitirConsultaRapida(
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
  if (!doctor.cedulaProfesional?.trim()) {
    return { error: "Su perfil no tiene cédula profesional. Complétela en Mi perfil para poder emitir recetas." };
  }

  let partidasRaw: unknown;
  try {
    partidasRaw = JSON.parse(String(fd.get("partidas") ?? "[]"));
  } catch {
    return { error: "Formato de medicamentos inválido." };
  }

  const parsed = consultaSchema.safeParse({
    pesoKg: fd.get("pesoKg") || undefined,
    tallaCm: fd.get("tallaCm") || undefined,
    taSistolica: fd.get("taSistolica") || undefined,
    taDiastolica: fd.get("taDiastolica") || undefined,
    fc: fd.get("fc") || undefined,
    temperatura: fd.get("temperatura") || undefined,
    spo2: fd.get("spo2") || undefined,
    glucosa: fd.get("glucosa") || undefined,
    diagnostico: String(fd.get("diagnostico") ?? ""),
    estudios: String(fd.get("estudios") ?? "") || undefined,
    indicacionesGenerales: String(fd.get("indicacionesGenerales") ?? "") || undefined,
    proximaCita: String(fd.get("proximaCita") ?? "") || undefined,
    partidas: partidasRaw,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const paciente = asignacion.paciente;

  // Guardar signos vitales en la hoja (actualizar la existente)
  const hoja = await db.hojaPrimerLlenado.findFirst({
    where: { pacienteId: paciente.id },
    orderBy: { version: "desc" },
  });
  if (hoja) {
    await db.hojaPrimerLlenado.update({
      where: { id: hoja.id },
      data: {
        pesoKg: d.pesoKg ?? null,
        tallaCm: d.tallaCm ?? null,
        taSistolica: d.taSistolica ?? null,
        taDiastolica: d.taDiastolica ?? null,
        fc: d.fc ?? null,
        temperatura: d.temperatura ?? null,
        spo2: d.spo2 ?? null,
        glucosa: d.glucosa ?? null,
      },
    });
  }

  // Crear nota de evolución con signos vitales y diagnóstico
  const signosVitales = {
    pesoKg: d.pesoKg, tallaCm: d.tallaCm,
    taSistolica: d.taSistolica, taDiastolica: d.taDiastolica,
    fc: d.fc, temperatura: d.temperatura, spo2: d.spo2, glucosa: d.glucosa,
  };
  const planTexto = d.partidas.map((p, i) =>
    `${i + 1}. ${p.medicamento} ${p.dosis} — ${p.viaAdministracion}, ${p.frecuencia}, ${p.duracion}`
  ).join("\n");

  await db.notaEvolucion.create({
    data: {
      asignacionId,
      diagnosticos: d.diagnostico,
      planTratamiento: planTexto,
      resultadosEstudios: d.estudios || null,
      signosVitales,
      estado: "FIRMADA",
      fechaFirma: new Date(),
      elaboradaPorId: user.id,
    },
  });

  // Emitir receta
  let establecimiento: { razonSocial: string; domicilio: string; telefono: string; logotipo: string | null };
  if (user.workspaceTipo === "BASIC") {
    if (!doctor.domicilioConsultorio?.trim()) {
      return { error: "Falta el domicilio de su consultorio (obligatorio en la receta). Complételo en Mi perfil." };
    }
    establecimiento = {
      razonSocial: doctor.usuario.nombreCompleto,
      domicilio: doctor.domicilioConsultorio,
      telefono: doctor.telefono ?? "",
      logotipo: null,
    };
  } else {
    const config = await db.configuracion.findUniqueOrThrow({ where: { id: 1 } });
    establecimiento = { razonSocial: config.razonSocial, domicilio: config.domicilio!, telefono: config.telefono, logotipo: config.logotipo };
  }

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
        peso: d.pesoKg ? String(d.pesoKg) : null,
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
    usuarioId: user.id, rol: user.rol, accion: "CONSULTA_RAPIDA", entidad: "receta",
    entidadId: receta.id, pacienteId: paciente.id,
    datosDespues: { folio: receta.folio, diagnostico: d.diagnostico, medicamentos: d.partidas.length },
  });

  redirect(`/pacientes/${paciente.id}/recetas/${receta.id}`);
}
