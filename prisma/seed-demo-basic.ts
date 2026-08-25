// Registro de PRUEBA para la modalidad BASIC (consultorio independiente): un
// doctor con su propio workspace, un paciente, nota SOAP firmada y receta con
// PDF real — el mismo recorrido que un médico independiente hace solo, sin
// enfermería ni administrador. Idempotente: se puede correr varias veces.
//   npx tsx prisma/seed-demo-basic.ts
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { renderToBuffer } from "@react-pdf/renderer";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import React from "react";
import { RecetaPdf } from "../src/pdf/RecetaPdf";

const prisma = new PrismaClient();
const UPLOADS = process.env.UPLOADS_DIR ?? "/data/uploads";
const ARGON2 = { memoryCost: 19456, timeCost: 2, parallelism: 1 };
const EMAIL = "doctor.demo.basic@example.com";
const PASSWORD = process.env.SEED_DEMO_BASIC_PASSWORD ?? "DoctorBasicDemo2026!";
const PACIENTE_EMAIL = "paciente.demo.basic2@example.com";
const PACIENTE_PASSWORD = "PortalDemo2026!";

async function main() {
  // ── Doctor + workspace propio ──
  let usuario = await prisma.usuario.findUnique({ where: { email: EMAIL }, include: { doctor: true } });
  if (!usuario) {
    const workspace = await prisma.workspace.create({
      data: { tipo: "BASIC", plan: "CONSULTORIO", nombre: "Consultorio — Dra. Sofía Ramos Demo" },
    });
    usuario = await prisma.usuario.create({
      data: {
        workspaceId: workspace.id,
        rol: "DOCTOR",
        email: EMAIL,
        passwordHash: await hash(PASSWORD, ARGON2),
        nombreCompleto: "Dra. Sofía Ramos Demo",
        debeCambiarPassword: false,
        doctor: {
          create: {
            cedulaProfesional: "55555555",
            institucionTitulo: "UNAM (DEMO)",
            telefono: "5528380715",
            domicilioConsultorio: "Av. Insurgentes Sur 1234, Col. Del Valle, CP 03100, CDMX",
          },
        },
      },
      include: { doctor: true },
    });
  }
  const doctor = usuario.doctor!;

  const especialidad = await prisma.especialidad.upsert({
    where: { nombre: "Medicina General" },
    update: {},
    create: { nombre: "Medicina General" },
  });
  await prisma.doctorEspecialidad.upsert({
    where: { doctorId_especialidadId: { doctorId: doctor.id, especialidadId: especialidad.id } },
    update: {},
    create: { doctorId: doctor.id, especialidadId: especialidad.id },
  });

  // ── Paciente (idempotente por nombre) ──
  const existente = await prisma.paciente.findFirst({
    where: { workspaceId: usuario.workspaceId, nombre: "Roberto", apellidoPaterno: "Iglesias" },
  });
  if (existente) {
    // Asegurar que la cuenta de portal exista aunque el paciente ya estaba creado
    const portalExiste = await prisma.usuario.findUnique({ where: { email: PACIENTE_EMAIL } });
    if (!portalExiste) {
      await prisma.usuario.create({
        data: {
          workspaceId: usuario.workspaceId,
          rol: "PACIENTE",
          email: PACIENTE_EMAIL,
          passwordHash: await hash(PACIENTE_PASSWORD, ARGON2),
          nombreCompleto: "Roberto Iglesias Durán",
          debeCambiarPassword: false,
          pacienteId: existente.id,
        },
      });
      console.log(`Cuenta portal creada: ${PACIENTE_EMAIL} / ${PACIENTE_PASSWORD}`);
    }
    console.log(`Paciente demo BASIC ya existe: ${existente.numeroExpediente} (${existente.id})`);
    console.log(`Doctor demo: ${EMAIL} / ${PASSWORD}`);
    console.log(`Portal paciente: ${PACIENTE_EMAIL} / ${PACIENTE_PASSWORD}`);
    return;
  }

  const year = new Date().getFullYear();
  const nPac = await prisma.paciente.count({ where: { numeroExpediente: { startsWith: `EXP-${year}-` } } });
  const paciente = await prisma.paciente.create({
    data: {
      workspaceId: usuario.workspaceId,
      numeroExpediente: `EXP-${year}-${String(nPac + 1).padStart(5, "0")}`,
      nombre: "Roberto",
      apellidoPaterno: "Iglesias",
      apellidoMaterno: "Durán",
      fechaNacimiento: new Date("1978-02-20"),
      sexo: "M",
      tipoSangre: "A+",
      telefono: "5598765432",
      email: "paciente.demo.basic@example.com",
      derechohabiencia: "Ninguna",
      createdById: usuario.id,
    },
  });

  // ── Cuenta de portal para el paciente ──
  await prisma.usuario.create({
    data: {
      workspaceId: usuario.workspaceId,
      rol: "PACIENTE",
      email: PACIENTE_EMAIL,
      passwordHash: await hash(PACIENTE_PASSWORD, ARGON2),
      nombreCompleto: "Roberto Iglesias Durán",
      debeCambiarPassword: false,
      pacienteId: paciente.id,
    },
  });

  // ── Hoja de primer llenado (el propio doctor la captura y la cierra) ──
  await prisma.hojaPrimerLlenado.create({
    data: {
      pacienteId: paciente.id,
      version: 1,
      capturadoPorId: usuario.id,
      motivoConsulta: "Revisión general y control de peso",
      padecimientoActual: "Paciente asintomático, acude a valoración de rutina.",
      alergias: "NINGUNA CONOCIDA",
      medicamentosActuales: "Ninguno",
      taSistolica: 122,
      taDiastolica: 80,
      fc: 74,
      fr: 16,
      temperatura: 36.6,
      pesoKg: 82,
      tallaCm: 174,
      spo2: 98,
      estado: "CERRADA",
      disponibleConsulta: true,
      fechaCierre: new Date(),
    },
  });

  // ── Asignación (autoasignación: el mismo mecanismo que usa cerrarHoja en BASIC) ──
  const asignacion = await prisma.asignacion.create({
    data: { pacienteId: paciente.id, especialidadId: especialidad.id, doctorId: doctor.id },
  });

  // ── Nota SOAP firmada ──
  const nota = await prisma.notaEvolucion.create({
    data: {
      asignacionId: asignacion.id,
      elaboradaPorId: usuario.id,
      subjetivo: "Paciente refiere buen estado general, sin síntomas actuales. Acude a chequeo de rutina.",
      objetivo: "Exploración física sin alteraciones. Signos vitales dentro de parámetros normales.",
      diagnosticos: "Paciente sano. Sobrepeso grado I (IMC 27.1).",
      pronostico: "Bueno.",
      planTratamiento: "Metformina 500 mg vía oral cada 24 h por 30 días. Dieta hipocalórica y actividad física 30 min/día.",
      estado: "FIRMADA",
      fechaFirma: new Date(),
    },
  });

  // ── Receta con PDF real (mismo motor que usa emitirReceta) ──
  const nRx = await prisma.receta.count({ where: { folio: { startsWith: `RX-${year}-` } } });
  const folio = `RX-${year}-${String(nRx + 1).padStart(6, "0")}`;
  const partidas = [
    {
      medicamento: "Metformina",
      presentacion: "Tabletas 500 mg",
      dosis: "1 tableta (500 mg)",
      viaAdministracion: "Oral",
      frecuencia: "Cada 24 horas",
      duracion: "30 días",
      cantidad: "1 caja (30 tabletas)",
      indicaciones: "Tomar con alimentos para reducir molestias gástricas.",
    },
  ];
  const fechaEmision = new Date();
  const fechaLarga = fechaEmision.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short", timeZone: "America/Mexico_City" });
  const establecimiento = {
    razonSocial: usuario.nombreCompleto,
    domicilio: doctor.domicilioConsultorio!,
    telefono: doctor.telefono ?? "",
    logotipo: null,
  };

  const pdfData = {
    folio,
    fechaEmision: fechaLarga,
    establecimiento,
    medico: {
      nombre: usuario.nombreCompleto,
      especialidad: especialidad.nombre,
      cedulaProfesional: doctor.cedulaProfesional,
      cedulaEspecialidad: doctor.cedulaEspecialidad,
      institucionTitulo: doctor.institucionTitulo,
      universidadEspecialidad: doctor.universidadEspecialidad,
      firmaDigitalizada: doctor.firmaDigitalizada,
    },
    paciente: {
      nombre: "Roberto Iglesias Durán",
      edad: "48 años",
      sexo: "Masculino",
      expediente: paciente.numeroExpediente,
      peso: "82",
    },
    diagnostico: "Sobrepeso grado I",
    partidas,
    indicacionesGenerales: "Control en 30 días con laboratorios (glucosa, perfil lipídico).",
    proximaCita: null,
  };

  const buf1 = await renderToBuffer(React.createElement(RecetaPdf, { data: pdfData }) as never);
  const h1 = createHash("sha256").update(buf1).digest("hex");
  const buf2 = await renderToBuffer(React.createElement(RecetaPdf, { data: { ...pdfData, hashDocumento: h1 } }) as never);
  const hashFinal = createHash("sha256").update(buf2).digest("hex");

  const dirRx = path.join(UPLOADS, "recetas", String(year));
  await mkdir(dirRx, { recursive: true });
  const rutaRx = path.join(dirRx, `${folio}.pdf`);
  await writeFile(rutaRx, buf2);

  const docReceta = await prisma.documento.create({
    data: {
      pacienteId: paciente.id,
      tipo: "RECETA",
      nombreArchivo: `${folio}.pdf`,
      ruta: rutaRx,
      hashSha256: hashFinal,
      subidoPorId: usuario.id,
    },
  });

  const receta = await prisma.receta.create({
    data: {
      folio,
      asignacionId: asignacion.id,
      notaEvolucionId: nota.id,
      fechaEmision,
      diagnostico: pdfData.diagnostico,
      indicacionesGenerales: pdfData.indicacionesGenerales,
      snapshotMedico: {
        nombre: usuario.nombreCompleto,
        cedulaProfesional: doctor.cedulaProfesional,
        institucionTitulo: doctor.institucionTitulo,
        especialidad: especialidad.nombre,
        establecimiento,
      },
      snapshotPaciente: {
        nombre: "Roberto Iglesias Durán",
        expediente: paciente.numeroExpediente,
        fechaNacimiento: paciente.fechaNacimiento.toISOString(),
        sexo: "M",
        email: paciente.email,
      },
      documentoId: docReceta.id,
      estadoEnvio: "PENDIENTE",
      partidas: { create: partidas.map((p, i) => ({ orden: i + 1, ...p })) },
    },
  });
  await prisma.emailQueue.create({ data: { recetaId: receta.id, destinatario: paciente.email! } });

  await prisma.bitacora.create({
    data: {
      usuarioId: usuario.id,
      rolSnapshot: "DOCTOR",
      accion: "CREAR",
      entidad: "registro_demo_basic",
      entidadId: paciente.id,
      pacienteId: paciente.id,
      datosDespues: { nota: "Registro de prueba BASIC generado por seed-demo-basic" },
    },
  });

  console.log(`\nRegistro demo BASIC completo:`);
  console.log(`  Doctor: ${EMAIL} / ${PASSWORD}`);
  console.log(`  Paciente: Roberto Iglesias Durán — ${paciente.numeroExpediente} (id ${paciente.id})`);
  console.log(`  Portal paciente: ${PACIENTE_EMAIL} / ${PACIENTE_PASSWORD}`);
  console.log(`  Receta: ${folio}`);
  console.log(`  Nota SOAP firmada y receta con PDF cargadas.`);
}

main()
  .catch((e) => {
    console.error("Error al sembrar el registro demo BASIC:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
