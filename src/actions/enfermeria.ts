"use server";

import { revalidatePath } from "next/cache";
import { redirect, notFound } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCapturista, assertPacienteEnWorkspace, AuthzError } from "@/lib/authz";
import { siguienteFolio } from "@/lib/folio";
import { audit } from "@/lib/audit";
import type { ActionState } from "./auth";

// ── Registro de paciente + hoja de primer llenado ──────────────────────────────

const pacienteSchema = z.object({
  nombre: z.string().min(2, "Nombre requerido"),
  apellidoPaterno: z.string().min(2, "Apellido paterno requerido"),
  apellidoMaterno: z.string().optional(),
  fechaNacimiento: z.string().refine((v) => !isNaN(Date.parse(v)), "Fecha de nacimiento inválida"),
  sexo: z.enum(["M", "F", "O"], { message: "Sexo requerido" }),
  curp: z.string().optional(),
  tipoSangre: z.string().optional(),
  estadoCivil: z.string().optional(),
  ocupacion: z.string().optional(),
  escolaridad: z.string().optional(),
  religion: z.string().optional(),
  nacionalidad: z.string().optional(),
  referencia: z.string().optional(),
  calle: z.string().optional(),
  colonia: z.string().optional(),
  municipio: z.string().optional(),
  estado: z.string().optional(),
  cp: z.string().optional(),
  telefono: z.string().min(7, "Teléfono requerido"),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  sinCorreo: z.coerce.boolean().default(false),
  contactoEmergenciaNombre: z.string().optional(),
  contactoEmergenciaTelefono: z.string().optional(),
  contactoEmergenciaParentesco: z.string().optional(),
  derechohabiencia: z.string().optional(),
});

export async function registrarPaciente(_p: ActionState, fd: FormData): Promise<ActionState & { pacienteId?: string }> {
  const user = await requireCapturista();
  const parsed = pacienteSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  // Correo obligatorio salvo casilla explícita "sin correo" (§4.4-A del plan)
  if (!d.sinCorreo && !d.email) {
    return { error: "El correo es indispensable para el envío de recetas. Si el paciente no tiene, marque la casilla «Paciente sin correo electrónico»." };
  }

  const paciente = await db.$transaction(async (tx) => {
    const numeroExpediente = await siguienteFolio(tx, "paciente", user.workspaceTipo);
    return tx.paciente.create({
      data: {
        workspaceId: user.workspaceId,
        numeroExpediente,
        nombre: d.nombre,
        apellidoPaterno: d.apellidoPaterno,
        apellidoMaterno: d.apellidoMaterno || null,
        fechaNacimiento: new Date(d.fechaNacimiento),
        sexo: d.sexo,
        curp: d.curp || null,
        tipoSangre: d.tipoSangre || null,
        estadoCivil: d.estadoCivil || null,
        ocupacion: d.ocupacion || null,
        escolaridad: d.escolaridad || null,
        religion: d.religion || null,
        nacionalidad: d.nacionalidad || null,
        referencia: d.referencia || null,
        calle: d.calle || null,
        colonia: d.colonia || null,
        municipio: d.municipio || null,
        estado: d.estado || null,
        cp: d.cp || null,
        telefono: d.telefono,
        email: d.sinCorreo ? null : d.email || null,
        sinCorreo: d.sinCorreo,
        contactoEmergenciaNombre: d.contactoEmergenciaNombre || null,
        contactoEmergenciaTelefono: d.contactoEmergenciaTelefono || null,
        contactoEmergenciaParentesco: d.contactoEmergenciaParentesco || null,
        derechohabiencia: d.derechohabiencia || null,
        createdById: user.id,
      },
    });
  });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "CREAR", entidad: "paciente",
    entidadId: paciente.id, pacienteId: paciente.id,
    datosDespues: { expediente: paciente.numeroExpediente },
  });

  // BASIC: salta la hoja completa, crea hoja mínima con alergias, auto-asigna y va a receta
  if (user.workspaceTipo === "BASIC" && user.rol === "DOCTOR" && user.doctorId) {
    const alergias = String(fd.get("alergias") ?? "").trim() || "No referidas";
    await db.hojaPrimerLlenado.create({
      data: {
        pacienteId: paciente.id,
        alergias,
        estado: "CERRADA",
        disponibleConsulta: true,
        fechaCierre: new Date(),
        capturadoPorId: user.id,
      },
    });
    const propia = await db.doctorEspecialidad.findFirst({ where: { doctorId: user.doctorId } });
    if (propia) {
      await db.asignacion.create({
        data: { pacienteId: paciente.id, especialidadId: propia.especialidadId, doctorId: user.doctorId },
      });
    }
    redirect(`/pacientes/${paciente.id}/consulta-rapida`);
  }

  redirect(`/enfermeria/hoja/${paciente.id}`);
}

// ── Hoja de primer llenado (borrador guardable, cierre inmutable) ──────────────

const hojaSchema = z.object({
  motivoConsulta: z.string().optional(),
  padecimientoActual: z.string().optional(),
  especialidadesSugeridas: z.string().optional(),
  antecedentesHeredofamiliares: z.string().optional(),
  antecedentesPatologicos: z.string().optional(),
  antecedentesNoPatologicos: z.string().optional(),
  antecedentesGinecoObstetricos: z.string().optional(),
  alergias: z.string().optional(),
  medicamentosActuales: z.string().optional(),
  interrogatorioAparatos: z.string().optional(),
  cirugiaDeseada: z.string().optional(),
  presupuesto: z.string().optional(),
  fechaProgramadaDeseada: z.string().optional(),
  taSistolica: z.coerce.number().int().min(40).max(300).optional().or(z.literal("").transform(() => undefined)),
  taDiastolica: z.coerce.number().int().min(20).max(200).optional().or(z.literal("").transform(() => undefined)),
  fc: z.coerce.number().int().min(20).max(300).optional().or(z.literal("").transform(() => undefined)),
  fr: z.coerce.number().int().min(4).max(80).optional().or(z.literal("").transform(() => undefined)),
  temperatura: z.coerce.number().min(30).max(45).optional().or(z.literal("").transform(() => undefined)),
  pesoKg: z.coerce.number().min(0.5).max(400).optional().or(z.literal("").transform(() => undefined)),
  tallaCm: z.coerce.number().min(30).max(250).optional().or(z.literal("").transform(() => undefined)),
  spo2: z.coerce.number().int().min(40).max(100).optional().or(z.literal("").transform(() => undefined)),
  glucosa: z.coerce.number().int().min(20).max(800).optional().or(z.literal("").transform(() => undefined)),
  escalaDolor: z.coerce.number().int().min(0).max(10).optional().or(z.literal("").transform(() => undefined)),
  observacionesEnfermeria: z.string().optional(),
});

async function upsertHoja(pacienteId: string, userId: string, data: z.infer<typeof hojaSchema>) {
  const borrador = await db.hojaPrimerLlenado.findFirst({
    where: { pacienteId, estado: "BORRADOR" },
    orderBy: { version: "desc" },
  });
  if (borrador) {
    return db.hojaPrimerLlenado.update({ where: { id: borrador.id }, data });
  }
  const ultima = await db.hojaPrimerLlenado.findFirst({ where: { pacienteId }, orderBy: { version: "desc" } });
  return db.hojaPrimerLlenado.create({
    data: { pacienteId, capturadoPorId: userId, version: (ultima?.version ?? 0) + 1, ...data },
  });
}

export async function guardarBorradorHoja(pacienteId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireCapturista();
  try {
    await assertPacienteEnWorkspace(user, pacienteId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = hojaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  const hoja = await upsertHoja(pacienteId, user.id, parsed.data);
  await audit({ usuarioId: user.id, rol: user.rol, accion: "GUARDAR_BORRADOR", entidad: "hoja_primer_llenado", entidadId: hoja.id, pacienteId });
  revalidatePath(`/enfermeria/hoja/${pacienteId}`);
  return { ok: true };
}

export async function cerrarHoja(pacienteId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireCapturista();
  try {
    await assertPacienteEnWorkspace(user, pacienteId);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = hojaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: `${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}` };
  const d = parsed.data;

  // Obligatorios NOM-004 para poner disponible
  const faltantes: string[] = [];
  if (!d.motivoConsulta?.trim()) faltantes.push("motivo de consulta");
  if (!d.alergias?.trim()) faltantes.push("alergias (escriba «NINGUNA CONOCIDA» si aplica)");
  if (!d.taSistolica || !d.taDiastolica) faltantes.push("tensión arterial");
  if (!d.fc) faltantes.push("frecuencia cardiaca");
  if (!d.fr) faltantes.push("frecuencia respiratoria");
  if (!d.temperatura) faltantes.push("temperatura");
  if (!d.pesoKg) faltantes.push("peso");
  if (!d.tallaCm) faltantes.push("talla");
  if (faltantes.length) return { error: `Faltan campos obligatorios: ${faltantes.join(", ")}.` };

  const hoja = await upsertHoja(pacienteId, user.id, d);
  await db.hojaPrimerLlenado.update({
    where: { id: hoja.id },
    data: { estado: "CERRADA", disponibleConsulta: true, fechaCierre: new Date() },
  });
  await audit({ usuarioId: user.id, rol: user.rol, accion: "CERRAR", entidad: "hoja_primer_llenado", entidadId: hoja.id, pacienteId });

  // BASIC: el propio doctor la registró y la cerró — se autoasigna con su
  // especialidad y entra directo al expediente, sin pasar por "disponibles"
  // (esa cola es para el traspaso enfermería → doctor de una clínica).
  if (user.rol === "DOCTOR" && user.doctorId) {
    const propia = await db.doctorEspecialidad.findFirst({ where: { doctorId: user.doctorId } });
    if (propia) {
      const existente = await db.asignacion.findFirst({
        where: { pacienteId, doctorId: user.doctorId, especialidadId: propia.especialidadId, estado: "ACTIVA" },
      });
      if (!existente) {
        const asignacion = await db.asignacion.create({
          data: { pacienteId, especialidadId: propia.especialidadId, doctorId: user.doctorId },
        });
        await audit({
          usuarioId: user.id, rol: user.rol, accion: "TOMAR_PACIENTE", entidad: "asignacion",
          entidadId: asignacion.id, pacienteId,
        });
      }
    }
    redirect(`/pacientes/${pacienteId}`);
  }
  redirect("/enfermeria?disponible=1");
}

// ── Nueva visita (paciente existente): nueva versión de hoja precargada ─────────

export async function nuevaVisita(pacienteId: string) {
  const user = await requireCapturista();
  try {
    await assertPacienteEnWorkspace(user, pacienteId);
  } catch (e) {
    if (e instanceof AuthzError) notFound();
    throw e;
  }
  const anterior = await db.hojaPrimerLlenado.findFirst({
    where: { pacienteId, estado: "CERRADA" },
    orderBy: { version: "desc" },
  });
  const borrador = await db.hojaPrimerLlenado.findFirst({ where: { pacienteId, estado: "BORRADOR" } });
  if (!borrador) {
    await db.hojaPrimerLlenado.create({
      data: {
        pacienteId,
        capturadoPorId: user.id,
        version: (anterior?.version ?? 0) + 1,
        // precarga antecedentes; motivo y signos se capturan de nuevo
        antecedentesHeredofamiliares: anterior?.antecedentesHeredofamiliares,
        antecedentesPatologicos: anterior?.antecedentesPatologicos,
        antecedentesNoPatologicos: anterior?.antecedentesNoPatologicos,
        antecedentesGinecoObstetricos: anterior?.antecedentesGinecoObstetricos,
        alergias: anterior?.alergias,
        medicamentosActuales: anterior?.medicamentosActuales,
      },
    });
    await audit({ usuarioId: user.id, rol: user.rol, accion: "NUEVA_VISITA", entidad: "hoja_primer_llenado", pacienteId });
  }
  redirect(`/enfermeria/hoja/${pacienteId}`);
}
