// Registro de PRUEBA completo: paciente + hoja + doctor + nota + receta (PDF real)
// + expediente quirúrgico + citas + documentos adjuntos.
// Ejecutar en el VPS:
//   docker compose run --rm -v medtower-crm_uploads:/data/uploads migrate npx tsx prisma/seed-demo.tsx
import { PrismaClient } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { renderToBuffer } from "@react-pdf/renderer";
import { createHash } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import React from "react";
import { RecetaPdf } from "../src/pdf/RecetaPdf";

const prisma = new PrismaClient();
const UPLOADS = process.env.UPLOADS_DIR ?? "/data/uploads";
const ARGON2 = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

async function main() {
  const admin = await prisma.usuario.findUniqueOrThrow({ where: { email: "admin@medicaltower.mx" } });
  const especialidad = await prisma.especialidad.findUniqueOrThrow({ where: { nombre: "Cirugía Estética" } });
  const config = await prisma.configuracion.findUniqueOrThrow({ where: { id: 1 } });

  // ── Doctor demo ──
  let usuarioDoc = await prisma.usuario.findUnique({ where: { email: "doctor.demo@medicaltower.mx" }, include: { doctor: true } });
  if (!usuarioDoc) {
    usuarioDoc = await prisma.usuario.create({
      data: {
        rol: "DOCTOR",
        email: "doctor.demo@medicaltower.mx",
        passwordHash: await hash("DoctorDemo2026!", ARGON2),
        nombreCompleto: "Dr. Juan Pérez Demostración",
        debeCambiarPassword: false,
        doctor: {
          create: {
            cedulaProfesional: "99999999",
            cedulaEspecialidad: "88888888",
            institucionTitulo: "UNAM (DEMO)",
            universidadEspecialidad: "UNAM (DEMO)",
            consultorio: "Consultorio 302",
            telefono: "5528380715",
            especialidades: { create: [{ especialidadId: especialidad.id }] },
          },
        },
      },
      include: { doctor: true },
    });
  }
  const doctor = usuarioDoc.doctor!;

  // ── Enfermería demo ──
  await prisma.usuario.upsert({
    where: { email: "enfermeria.demo@medicaltower.mx" },
    update: {},
    create: {
      rol: "ENFERMERIA",
      email: "enfermeria.demo@medicaltower.mx",
      passwordHash: await hash("EnfermeriaDemo2026!", ARGON2),
      nombreCompleto: "Enf. Laura Demo",
      debeCambiarPassword: false,
    },
  });

  // ── Anestesiología demo ──
  await prisma.usuario.upsert({
    where: { email: "anestesiologo.demo@medicaltower.mx" },
    update: {},
    create: {
      rol: "ANESTESIOLOGO",
      email: "anestesiologo.demo@medicaltower.mx",
      passwordHash: await hash("AnestesiaDemo2026!", ARGON2),
      nombreCompleto: "Dra. Ana Demo",
      debeCambiarPassword: false,
    },
  });

  const existente = await prisma.paciente.findFirst({
    where: { nombre: "María Guadalupe", apellidoPaterno: "Ejemplo" },
  });
  if (existente) {
    console.log(`Paciente demo ya existe: ${existente.numeroExpediente} (${existente.id})`);
    console.log(`  Doctor demo: doctor.demo@medicaltower.mx / DoctorDemo2026!`);
    console.log(`  Enfermería demo: enfermeria.demo@medicaltower.mx / EnfermeriaDemo2026!`);
    console.log(`  Anestesiólogo demo: anestesiologo.demo@medicaltower.mx / AnestesiaDemo2026!`);
    return;
  }

  // ── Paciente ──
  const year = new Date().getFullYear();
  const nPac = await prisma.paciente.count({ where: { numeroExpediente: { startsWith: `MIT-${year}-` } } });
  const paciente = await prisma.paciente.create({
    data: {
      numeroExpediente: `MIT-${year}-${String(nPac + 1).padStart(5, "0")}`,
      nombre: "María Guadalupe",
      apellidoPaterno: "Ejemplo",
      apellidoMaterno: "De Prueba",
      fechaNacimiento: new Date("1990-05-12"),
      sexo: "F",
      curp: "EJPM900512MDFXXX09",
      tipoSangre: "O+",
      estadoCivil: "Casada",
      ocupacion: "Contadora",
      escolaridad: "Licenciatura",
      religion: "Católica",
      nacionalidad: "Mexicana",
      referencia: "Instagram",
      calle: "Av. Central 123",
      colonia: "Prados de Aragón",
      municipio: "Nezahualcóyotl",
      estado: "Estado de México",
      cp: "57179",
      telefono: "5512345678",
      email: "maestrosdelmediamdm@gmail.com",
      contactoEmergenciaNombre: "Pedro Ejemplo",
      contactoEmergenciaTelefono: "5587654321",
      contactoEmergenciaParentesco: "Esposo",
      derechohabiencia: "Ninguna",
      createdById: admin.id,
    },
  });

  // ── Hoja de primer llenado (cerrada) ──
  await prisma.hojaPrimerLlenado.create({
    data: {
      pacienteId: paciente.id,
      version: 1,
      capturadoPorId: admin.id,
      motivoConsulta: "Valoración para cirugía estética de nariz (rinoplastia)",
      padecimientoActual:
        "Paciente refiere inconformidad estética nasal de larga evolución; sin obstrucción respiratoria significativa. Solicita valoración quirúrgica.",
      especialidadesSugeridas: "Cirugía Estética",
      antecedentesHeredofamiliares: "Madre con hipertensión arterial. Padre con diabetes tipo 2. Sin antecedentes trombóticos ni oncológicos.",
      antecedentesPatologicos: "Niega crónicos. Quirúrgicos: cesárea (2019, sin complicaciones). Tabaquismo: negado. Alcohol: social. Toxicomanías: negadas.",
      antecedentesNoPatologicos: "Alimentación regular, ejercicio 2 veces/semana, esquema de vacunación completo, vivienda con todos los servicios.",
      antecedentesGinecoObstetricos: "Menarca 12 años. G1 P0 C1 A0. FUM 05/07/2026. MPF: DIU. Último Papanicolaou 2025 normal.",
      alergias: "PENICILINA (rash cutáneo)",
      medicamentosActuales: "Ninguno",
      interrogatorioAparatos: "Cardiovascular, respiratorio, gastrointestinal, nervioso, musculoesquelético y tegumentos: sin datos patológicos.",
      cirugiaDeseada: "Rinoplastia",
      presupuesto: "$45,000 - $60,000 MXN",
      fechaProgramadaDeseada: "Agosto 2026",
      taSistolica: 118,
      taDiastolica: 76,
      fc: 72,
      fr: 16,
      temperatura: 36.6,
      pesoKg: 62.5,
      tallaCm: 163,
      spo2: 98,
      glucosa: 92,
      escalaDolor: 0,
      observacionesEnfermeria: "Paciente tranquila, cooperadora. Registro de prueba del sistema.",
      estado: "CERRADA",
      disponibleConsulta: false,
      fechaCierre: new Date(),
    },
  });

  // ── Asignación ──
  const asignacion = await prisma.asignacion.create({
    data: { pacienteId: paciente.id, especialidadId: especialidad.id, doctorId: doctor.id },
  });

  // ── Nota de evolución firmada + adenda ──
  const nota = await prisma.notaEvolucion.create({
    data: {
      asignacionId: asignacion.id,
      elaboradaPorId: usuarioDoc.id,
      subjetivo: "Paciente acude a valoración para rinoplastia estética. Refiere buen estado general.",
      objetivo: "Pirámide nasal con giba osteocartilaginosa, punta poco definida. Vía aérea permeable. Resto de exploración sin alteraciones.",
      resultadosEstudios: "BH, QS, TP/TPT y ECG dentro de parámetros normales (estudios preoperatorios completos).",
      diagnosticos: "Deformidad estética nasal (giba dorsal). Candidata a rinoplastia primaria.",
      pronostico: "Bueno para la función y la estética.",
      planTratamiento:
        "Programar rinoplastia primaria. Pregabalina 75 mg VO cada 12 h por 3 días previos NO indicada; solo paracetamol 500 mg VO cada 8 h en caso de cefalea. Ayuno de 8 h previo a cirugía.",
      estado: "FIRMADA",
      fechaFirma: new Date(),
    },
  });
  await prisma.notaEvolucion.create({
    data: {
      asignacionId: asignacion.id,
      notaPadreId: nota.id,
      elaboradaPorId: usuarioDoc.id,
      subjetivo: "ADENDA: se aclara que la paciente es alérgica a PENICILINA; los esquemas antibióticos perioperatorios se ajustan a clindamicina.",
      estado: "FIRMADA",
      fechaFirma: new Date(),
    },
  });

  // ── Receta con PDF real ──
  const nRx = await prisma.receta.count({ where: { folio: { startsWith: `RX-${year}-` } } });
  const folio = `RX-${year}-${String(nRx + 1).padStart(6, "0")}`;
  const partidas = [
    {
      medicamento: "Clindamicina (Dalacin C)",
      presentacion: "Cápsulas 300 mg",
      dosis: "1 cápsula (300 mg)",
      viaAdministracion: "Oral",
      frecuencia: "Cada 8 horas",
      duracion: "7 días",
      cantidad: "1 caja (21 cápsulas)",
      indicaciones: "Tomar con abundante agua; no suspender aunque haya mejoría.",
    },
    {
      medicamento: "Paracetamol",
      presentacion: "Tabletas 500 mg",
      dosis: "1 tableta (500 mg)",
      viaAdministracion: "Oral",
      frecuencia: "Cada 8 horas",
      duracion: "5 días",
      cantidad: "1 caja",
      indicaciones: "En caso de dolor. No exceder 3 g al día.",
    },
  ];
  const fechaEmision = new Date();
  const fechaLarga = fechaEmision.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short", timeZone: "America/Mexico_City" });

  const pdfData = {
    folio,
    fechaEmision: fechaLarga,
    establecimiento: { razonSocial: config.razonSocial, domicilio: config.domicilio, telefono: config.telefono, logotipo: config.logotipo },
    medico: {
      nombre: usuarioDoc.nombreCompleto,
      especialidad: especialidad.nombre,
      cedulaProfesional: doctor.cedulaProfesional,
      cedulaEspecialidad: doctor.cedulaEspecialidad,
      institucionTitulo: doctor.institucionTitulo,
      universidadEspecialidad: doctor.universidadEspecialidad,
      firmaDigitalizada: doctor.firmaDigitalizada,
    },
    paciente: {
      nombre: "María Guadalupe Ejemplo De Prueba",
      edad: "36 años",
      sexo: "Femenino",
      expediente: paciente.numeroExpediente,
      peso: "62.5",
    },
    diagnostico: "Profilaxis antibiótica y analgesia postoperatoria — rinoplastia primaria",
    partidas,
    indicacionesGenerales:
      "Reposo relativo 72 h. Dormir con cabecera elevada 30°. No exponerse al sol. Acudir a urgencias en caso de sangrado abundante, fiebre > 38 °C o dolor no controlado.",
    proximaCita: "30 de julio de 2026, 10:00 — retiro de férula nasal",
  };

  const buf1 = await renderToBuffer(<RecetaPdf data={pdfData} />);
  const h1 = createHash("sha256").update(buf1).digest("hex");
  const buf2 = await renderToBuffer(<RecetaPdf data={{ ...pdfData, hashDocumento: h1 }} />);
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
      subidoPorId: usuarioDoc.id,
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
      proximaCita: pdfData.proximaCita,
      snapshotMedico: {
        nombre: usuarioDoc.nombreCompleto,
        cedulaProfesional: doctor.cedulaProfesional,
        institucionTitulo: doctor.institucionTitulo,
        especialidad: especialidad.nombre,
        establecimiento: { razonSocial: config.razonSocial, domicilio: config.domicilio, telefono: config.telefono },
      },
      snapshotPaciente: {
        nombre: "María Guadalupe Ejemplo De Prueba",
        expediente: paciente.numeroExpediente,
        fechaNacimiento: paciente.fechaNacimiento.toISOString(),
        sexo: "F",
        email: paciente.email,
      },
      documentoId: docReceta.id,
      estadoEnvio: "PENDIENTE",
      partidas: { create: partidas.map((p, i) => ({ orden: i + 1, ...p })) },
    },
  });
  await prisma.emailQueue.create({ data: { recetaId: receta.id, destinatario: paciente.email! } });

  // ── Expediente quirúrgico completo ──
  const qx = await prisma.expedienteQuirurgico.create({
    data: {
      asignacionId: asignacion.id,
      pacienteId: paciente.id,
      fechaCirugiaProgramada: new Date("2026-07-20T08:00:00-06:00"),
      quirofanoSede: "Quirófano 1, MIT Medical Tower",
      estado: "REALIZADA",
      consentimientoFecha: new Date("2026-07-18T12:00:00-06:00"),
    },
  });
  await prisma.notaPreoperatoria.create({
    data: {
      expedienteId: qx.id,
      elaboradaPorId: usuarioDoc.id,
      fechaHora: new Date("2026-07-19T10:00:00-06:00"),
      diagnosticoPreoperatorio: "Deformidad estética nasal (giba osteocartilaginosa dorsal).",
      planQuirurgico: "Rinoplastia primaria abierta: resección de giba, osteotomías laterales, refinamiento de punta.",
      tipoCirugia: "Programada / electiva",
      riesgoQuirurgico: "ASA I — paciente sana, sin comorbilidades. Riesgo tromboembólico bajo (Caprini 2).",
      cuidadosPlanTerapeutico: "Ayuno 8 h. Profilaxis con clindamicina 600 mg IV (alergia a penicilina). Valoración preanestésica completa.",
      pronostico: "Bueno para la vida y la función.",
      estado: "FIRMADA",
      fechaFirma: new Date("2026-07-19T10:05:00-06:00"),
    },
  });
  await prisma.notaPostoperatoria.create({
    data: {
      expedienteId: qx.id,
      elaboradaPorId: usuarioDoc.id,
      fechaHora: new Date("2026-07-20T11:30:00-06:00"),
      diagnosticoPreoperatorio: "Deformidad estética nasal (giba dorsal).",
      operacionPlaneada: "Rinoplastia primaria abierta.",
      operacionRealizada: "Rinoplastia primaria abierta sin cambios respecto al plan.",
      diagnosticoPostoperatorio: "Postoperada de rinoplastia primaria, evolución transoperatoria satisfactoria.",
      descripcionTecnica:
        "Bajo anestesia general balanceada e intubación orotraqueal: abordaje abierto con incisión transcolumelar en V invertida; disección del esqueleto osteocartilaginoso; resección de giba dorsal de 3 mm; osteotomías laterales bajas bilaterales; suturas de refinamiento de punta (transdomales); colocación de injerto columelar; cierre por planos; férula externa y taponamiento anterior bilateral.",
      hallazgos: "Giba osteocartilaginosa de 3 mm; cartílagos alares amplios; septum central sin desviación significativa.",
      conteoGasas: "Gasas, compresas e instrumental completos al término (conteo x2 verificado con enfermería circulante).",
      incidentesAccidentes: "Sin incidentes ni accidentes.",
      cuantificacionSangrado: "50 mL",
      transfusiones: "No requeridas",
      estudiosTransoperatorios: "No requeridos",
      equipoQuirurgico:
        "Cirujano: Dr. Juan Pérez Demostración (céd. 99999999). Anestesiólogo: Dra. Ana Demo (céd. 77777777). Instrumentista: Enf. Laura Demo. Circulante: Enf. Carlos Demo.",
      estadoPostquirurgico: "Estable, extubada sin complicaciones, pasa a recuperación con Aldrete 9.",
      planManejo: "Analgesia con paracetamol, clindamicina VO 7 días, frío local, cabecera a 30°, retiro de taponamiento en 48 h, férula 7 días.",
      pronostico: "Bueno para la vida y la función estética.",
      envioPiezasPatologia: "No aplica",
      estado: "FIRMADA",
      fechaFirma: new Date("2026-07-20T11:40:00-06:00"),
    },
  });
  await prisma.citaPostoperatoria.create({
    data: {
      expedienteQxId: qx.id,
      asignacionId: asignacion.id,
      fechaHoraProgramada: new Date("2026-07-22T10:00:00-06:00"),
      motivo: "Retiro de taponamiento nasal y revisión de herida",
      estado: "REALIZADA",
      observaciones: "Taponamiento retirado sin sangrado. Herida limpia. Edema esperado.",
    },
  });
  await prisma.citaPostoperatoria.create({
    data: {
      expedienteQxId: qx.id,
      asignacionId: asignacion.id,
      fechaHoraProgramada: new Date("2026-07-30T10:00:00-06:00"),
      motivo: "Retiro de férula nasal y valoración",
      estado: "PROGRAMADA",
    },
  });

  // ── Adjuntos escaneados (copiados previamente a /data/uploads/demo/) ──
  const adjuntos: { archivo: string; tipo: "CONSENTIMIENTO" | "OTRO"; nombre: string }[] = [
    { archivo: "contrato_servicios_hospitalarios.pdf", tipo: "CONSENTIMIENTO", nombre: "Contrato de servicios hospitalarios (firmado).pdf" },
    { archivo: "nota_contacto_inicial.pdf", tipo: "OTRO", nombre: "Nota de contacto inicial MIT (escaneada).pdf" },
  ];
  for (const a of adjuntos) {
    const origen = path.join(UPLOADS, "demo", a.archivo);
    try {
      const contenido = await readFile(origen);
      const hashA = createHash("sha256").update(contenido).digest("hex");
      const dirA = path.join(UPLOADS, "adjuntos", paciente.id);
      await mkdir(dirA, { recursive: true });
      const rutaA = path.join(dirA, `${Date.now()}-${a.archivo}`);
      await writeFile(rutaA, contenido);
      await prisma.documento.create({
        data: { pacienteId: paciente.id, tipo: a.tipo, nombreArchivo: a.nombre, ruta: rutaA, hashSha256: hashA, subidoPorId: admin.id },
      });
      console.log(`Adjunto: ${a.nombre}`);
    } catch {
      console.log(`Adjunto omitido (no encontrado): ${origen}`);
    }
  }

  await prisma.bitacora.create({
    data: {
      usuarioId: admin.id,
      rolSnapshot: "ADMIN",
      accion: "CREAR",
      entidad: "registro_demo",
      entidadId: paciente.id,
      pacienteId: paciente.id,
      datosDespues: { nota: "Registro de prueba generado por seed-demo" },
    },
  });

  console.log(`\nRegistro demo completo:`);
  console.log(`  Paciente: María Guadalupe Ejemplo De Prueba — ${paciente.numeroExpediente} (id ${paciente.id})`);
  console.log(`  Doctor demo: doctor.demo@medicaltower.mx / DoctorDemo2026!`);
  console.log(`  Enfermería demo: enfermeria.demo@medicaltower.mx / EnfermeriaDemo2026!`);
  console.log(`  Anestesiólogo demo: anestesiologo.demo@medicaltower.mx / AnestesiaDemo2026!`);
  console.log(`  Receta: ${folio}`);
}

main().finally(() => prisma.$disconnect());
