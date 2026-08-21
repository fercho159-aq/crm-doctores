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
  const workspace = await prisma.workspace.findFirstOrThrow({ where: { tipo: "CLINIC" } });
  const especialidad = await prisma.especialidad.findUniqueOrThrow({ where: { nombre: "Cirugía Estética" } });
  const config = await prisma.configuracion.findUniqueOrThrow({ where: { id: 1 } });

  // ── Doctor ──
  // Si ya se sembraron los usuarios de prueba (npm run seed:usuarios), el paciente
  // demo se asigna al doctor de Cirugía Estética de ese juego, para no manejar dos
  // listas de credenciales. Si no existe, se crea la cuenta «doctor.demo».
  let usuarioDoc = await prisma.usuario.findUnique({
    where: { email: "dr.estetica.pruebas@medicaltower.mx" },
    include: { doctor: true },
  });
  if (usuarioDoc?.doctor) {
    // La asignación exige que el doctor tenga la especialidad del episodio.
    await prisma.doctorEspecialidad.upsert({
      where: { doctorId_especialidadId: { doctorId: usuarioDoc.doctor.id, especialidadId: especialidad.id } },
      update: {},
      create: { doctorId: usuarioDoc.doctor.id, especialidadId: especialidad.id },
    });
  }
  if (!usuarioDoc) {
    usuarioDoc = await prisma.usuario.findUnique({ where: { email: "doctor.demo@medicaltower.mx" }, include: { doctor: true } });
  }
  if (!usuarioDoc) {
    usuarioDoc = await prisma.usuario.create({
      data: {
        workspaceId: workspace.id,
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

  // ── Enfermería ──
  const hayEnfPruebas = await prisma.usuario.findUnique({
    where: { email: "enf.matutino.pruebas@medicaltower.mx" },
    select: { id: true },
  });
  if (!hayEnfPruebas) await prisma.usuario.upsert({
    where: { email: "enfermeria.demo@medicaltower.mx" },
    update: {},
    create: {
      workspaceId: workspace.id,
      rol: "ENFERMERIA",
      email: "enfermeria.demo@medicaltower.mx",
      passwordHash: await hash("EnfermeriaDemo2026!", ARGON2),
      nombreCompleto: "Enf. Laura Demo",
      debeCambiarPassword: false,
    },
  });

  // ── Anestesiología ──
  // Lleva ficha de Doctor para que las hojas de anestesiología salgan con cédula.
  const anestPruebas = await prisma.usuario.findUnique({
    where: { email: "anest.uno.pruebas@medicaltower.mx" },
    select: { id: true },
  });
  const usuarioAnest = anestPruebas ?? await prisma.usuario.upsert({
    where: { email: "anestesiologo.demo@medicaltower.mx" },
    update: {},
    create: {
      workspaceId: workspace.id,
      rol: "ANESTESIOLOGO",
      email: "anestesiologo.demo@medicaltower.mx",
      passwordHash: await hash("AnestesiaDemo2026!", ARGON2),
      nombreCompleto: "Dra. Ana Demo",
      debeCambiarPassword: false,
      doctor: {
        create: {
          cedulaProfesional: "77777777",
          cedulaEspecialidad: "66666666",
          institucionTitulo: "IPN (DEMO)",
          universidadEspecialidad: "UNAM (DEMO)",
          consultorio: "Anestesiología",
          telefono: "5528380715",
        },
      },
    },
  });

  const existente = await prisma.paciente.findFirst({
    where: { nombre: "María Guadalupe", apellidoPaterno: "Ejemplo" },
  });
  if (existente) {
    console.log(`Paciente demo ya existe: ${existente.numeroExpediente} (${existente.id})`);
    console.log(`  Credenciales: «npm run seed:usuarios» para las cuentas de prueba,`);
    console.log(`  o las .demo si el registro se sembró antes de crearlas.`);
    return;
  }

  // ── Paciente ──
  const year = new Date().getFullYear();
  const nPac = await prisma.paciente.count({ where: { numeroExpediente: { startsWith: `MIT-${year}-` } } });
  const paciente = await prisma.paciente.create({
    data: {
      workspaceId: workspace.id,
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

  // ── Prescripción médica de medicamentos (hoja oficial 1) ──
  // Los renglones se escriben antes de firmar: el trigger de la base rechaza
  // escribir en una hoja ya firmada.
  const presc = await prisma.hojaPrescripcion.create({
    data: {
      pacienteId: paciente.id,
      asignacionId: asignacion.id,
      cuarto: "204",
      diagnostico: "Postoperada de rinoplastia primaria",
      dieta: "Blanda, fraccionada, abundantes líquidos",
      elaboradaPorId: usuarioDoc.id,
      fechaHora: new Date("2026-07-20T13:00:00-06:00"),
    },
  });
  await prisma.prescripcionPartida.createMany({
    data: [
      { hojaId: presc.id, orden: 1, fecha: new Date("2026-07-20"), medicamento: "Clindamicina 300 mg cápsulas", dosis: "300 mg", via: "Oral", horario: "c/8 h por 7 días" },
      { hojaId: presc.id, orden: 2, fecha: new Date("2026-07-20"), medicamento: "Paracetamol 500 mg tabletas", dosis: "500 mg", via: "Oral", horario: "c/8 h por 5 días" },
      { hojaId: presc.id, orden: 3, fecha: new Date("2026-07-20"), medicamento: "Ketorolaco 30 mg solución inyectable", dosis: "30 mg", via: "IV", horario: "c/8 h las primeras 24 h" },
      { hojaId: presc.id, orden: 4, fecha: new Date("2026-07-20"), medicamento: "Metoclopramida 10 mg solución inyectable", dosis: "10 mg", via: "IV", horario: "c/8 h por razón necesaria" },
    ],
  });
  await prisma.hojaPrescripcion.update({
    where: { id: presc.id },
    data: { estado: "FIRMADA", fechaFirma: new Date("2026-07-20T13:05:00-06:00") },
  });

  // ── Hoja de órdenes médicas (hojas oficiales 9-10) ──
  const ordenes = await prisma.hojaOrdenes.create({
    data: {
      pacienteId: paciente.id,
      asignacionId: asignacion.id,
      cuarto: "204",
      elaboradaPorId: usuarioDoc.id,
      fechaHora: new Date("2026-07-20T13:10:00-06:00"),
    },
  });
  await prisma.ordenPartida.createMany({
    data: [
      { hojaId: ordenes.id, orden: 1, categoria: "DIETA", texto: "Ayuno por 6 horas; posteriormente dieta blanda fraccionada." },
      { hojaId: ordenes.id, orden: 2, categoria: "CUIDADOS", texto: "Signos vitales cada 4 horas." },
      { hojaId: ordenes.id, orden: 3, categoria: "CUIDADOS", texto: "Cabecera a 30°; frío local en dorso nasal 20 minutos cada 2 horas." },
      { hojaId: ordenes.id, orden: 4, categoria: "CUIDADOS", texto: "Vigilar sangrado por taponamiento anterior; reportar si es abundante." },
      { hojaId: ordenes.id, orden: 5, categoria: "SOLUCIONES", texto: "Solución Hartmann 1000 mL para 8 horas." },
      { hojaId: ordenes.id, orden: 6, categoria: "MEDICAMENTOS", texto: "Ketorolaco 30 mg IV cada 8 horas." },
      { hojaId: ordenes.id, orden: 7, categoria: "MEDICAMENTOS", texto: "Clindamicina 300 mg VO cada 8 horas (alergia a penicilina)." },
      { hojaId: ordenes.id, orden: 8, categoria: "ESTUDIOS", texto: "Biometría hemática de control al día siguiente." },
    ],
  });
  await prisma.hojaOrdenes.update({
    where: { id: ordenes.id },
    data: { estado: "FIRMADA", fechaFirma: new Date("2026-07-20T13:12:00-06:00") },
  });

  // ── Hoja de consumo en quirófano (hojas oficiales 11-12) ──
  const hojaConsumo = await prisma.hojaConsumo.create({
    data: {
      pacienteId: paciente.id,
      expedienteQxId: qx.id,
      tipo: "QUIROFANO",
      cuarto: "204",
      procedimiento: "Rinoplastia primaria abierta",
      fechaIngreso: new Date("2026-07-20T07:00:00-06:00"),
      fechaEgreso: new Date("2026-07-21T11:00:00-06:00"),
      horaIngresoQuirofano: "09:00",
      horaTerminoQuirofano: "11:20",
      turno: "Matutino",
      medicoTratante: "Dr. Juan Pérez Demostración",
      medicoCirujano: "Dr. Juan Pérez Demostración",
      medicoAnestesiologo: "Dra. Ana Demo",
      enfermera: "Enf. Carlos Demo",
      instrumentista: "Enf. Laura Demo",
      capturadoPorId: admin.id,
    },
  });
  // Precios de demostración sobre el catálogo, para que la cuenta cuadre.
  const preciosDemo: Record<string, number> = {
    "PAQUETE DE GASAS": 45, "GUANTE 7.5": 28, "JERINGA DE 5": 6, "HOJA DE BISTURÍ": 18,
    "ISODINE": 120, "MICROPORE": 35, "EQUIPO DE VENOCLISIS": 65,
    "PROPOFOL": 180, "FENTANIL": 210, "KETOROLACO": 42, "DEXAMETAXONA": 38,
    "LIDOCAINA CON APINEFRINA": 55, "BROMURO DE RONCURONIO": 165,
    "NYLON O DERMALON 3-0": 190, "CAT GUT 2/0": 145,
    "SOLUCIÓN HARTMANN 1000 ml.": 85,
    "LABORATORIO": 1450, "DERECHO DE SALA": 8500, "HONORARIOS MÉDICOS": 45000,
    "MATERIALES Y MEDICAMENTOS": 4200, "ESTANCIA": 3200, "OXÍGENO": 450,
    "MEDICINA ESPECIALIZADA": 6500,
  };
  const consumidoDemo: Record<string, number> = {
    "PAQUETE DE GASAS": 6, "GUANTE 7.5": 4, "JERINGA DE 5": 8, "HOJA DE BISTURÍ": 2,
    "ISODINE": 1, "MICROPORE": 2, "EQUIPO DE VENOCLISIS": 1,
    "PROPOFOL": 2, "FENTANIL": 1, "KETOROLACO": 3, "DEXAMETAXONA": 1,
    "LIDOCAINA CON APINEFRINA": 2, "BROMURO DE RONCURONIO": 1,
    "NYLON O DERMALON 3-0": 2, "CAT GUT 2/0": 1,
    "SOLUCIÓN HARTMANN 1000 ml.": 2,
    "LABORATORIO": 1, "DERECHO DE SALA": 1, "HONORARIOS MÉDICOS": 1,
    "MATERIALES Y MEDICAMENTOS": 1, "ESTANCIA": 1, "OXÍGENO": 1,
    "MEDICINA ESPECIALIZADA": 1,
  };
  let ordenConsumo = 0;
  for (const [nombre, precio] of Object.entries(preciosDemo)) {
    const insumo = await prisma.insumo.findFirst({ where: { nombre } });
    if (!insumo) continue;
    await prisma.insumo.update({ where: { id: insumo.id }, data: { precio } });
    const cantidad = consumidoDemo[nombre] ?? 0;
    if (cantidad === 0) continue;
    ordenConsumo += 1;
    await prisma.consumoPartida.create({
      data: {
        hojaId: hojaConsumo.id,
        insumoId: insumo.id,
        descripcion: insumo.nombre,
        categoria: insumo.categoria,
        cantidad,
        precioUnitario: precio,
        importe: cantidad * precio,
        orden: ordenConsumo,
      },
    });
  }

  // ── Valoración preanestésica (hojas oficiales 15-16) ──
  await prisma.valoracionPreanestesica.create({
    data: {
      expedienteQxId: qx.id,
      pacienteId: paciente.id,
      anestesiologoId: usuarioAnest.id,
      habitacion: "204",
      servicio: "Cirugía Estética",
      folio: "VP-2026-0001",
      tipoPago: "PARTICULAR",
      fechaIngreso: new Date("2026-07-20T07:00:00-06:00"),
      horaIngreso: "07:00",
      diagnosticoPrequirurgico: "Deformidad estética nasal (giba dorsal y punta bulbosa)",
      cirugiaPlaneada: "Rinoplastia primaria abierta",
      cirujano: "Dr. Juan Pérez Demostración",
      anestesiologo: "Dra. Ana Demo",
      tipoCirugia: ["Mayor", "Electiva"],
      antecedentesImportancia:
        "Alergia a PENICILINA (rash cutáneo). Cesárea en 2019 bajo bloqueo peridural sin complicaciones. Niega crónicos, tabaquismo y toxicomanías.",
      pesoKg: 62.5,
      tallaCm: 163,
      imc: 23.52,
      temperatura: 36.4,
      ta: "118/76",
      fr: 16,
      fc: 72,
      spo2: 98,
      exCabeza: "Normocéfala, sin lesiones. Deformidad nasal estética.",
      exCuello: "Cilíndrico, móvil, sin adenomegalias.",
      exRespiratorio: "Murmullo vesicular presente en ambos campos, sin agregados.",
      exCardiovascular: "Ruidos cardiacos rítmicos, sin soplos.",
      exGastrointestinal: "Abdomen blando, depresible, no doloroso.",
      exGenitourinario: "Sin alteraciones.",
      labFecha: new Date("2026-07-17"),
      grupoSanguineo: "O",
      factorRh: "Positivo",
      hemoglobina: "13.8",
      hematocrito: "41",
      plaquetas: "268,000",
      leucocitos: "6,900",
      tp: "11.8",
      tpt: "27",
      tt: "15",
      glucosa: "88",
      creatinina: "0.7",
      urea: "24",
      sodio: "139",
      potasio: "4.2",
      cloro: "103",
      calcio: "9.4",
      ecg: "Ritmo sinusal, sin datos de isquemia.",
      rayosX: "Tórax sin alteraciones pleuropulmonares.",
      factoresRiesgo: { marcadas: ["Alergias", "Anestesias previas"], especificar: "Penicilina (rash). Bloqueo peridural en cesárea 2019, sin complicaciones." },
      asa: "I",
      goldman: [],
      predictores: { menores: [], intermedios: [], mayores: [] },
      trombolitico: { menores: ["sexoF", "cxMenor3h"], intermedios: [], mayores: [] },
      neurologico: { pupilas: ["Normal"], ojos: 4, motor: 6, verbal: 5 },
      viaAerea: {
        ventilacionDificil: [],
        mallampati: "Clase I",
        apertura: "Grado 1: ≥ 5 cm",
        tiromentoniana: "> 6.5 cm — fácil",
        subluxacion: "> 0 — los incisivos inferiores se colocan por delante de los superiores",
        extension: "> 100°",
      },
      planAnestesico: ["A.G.B."],
      fechaElaboracion: new Date("2026-07-20T07:30:00-06:00"),
      estado: "FIRMADA",
      fechaFirma: new Date("2026-07-20T07:35:00-06:00"),
    },
  });

  // ── Registro anestésico y transanestésico (hojas oficiales 17, 18 y 20) ──
  const registro = await prisma.registroAnestesico.create({
    data: {
      expedienteQxId: qx.id,
      pacienteId: paciente.id,
      anestesiologoId: usuarioAnest.id,
      evalFecha: new Date("2026-07-20T08:45:00-06:00"),
      evalHora: "08:45",
      consentimientoAnestesia: true,
      identificacionCorroborada: true,
      verificacionEquipo: [
        "Aparato de anestesia", "Circuito", "Fugas", "Cal sodada", "Ventilador",
        "Parámetros ventilatorios", "Flujómetros", "Vaporizadores", "Fuente de O2 y alarmas",
        "Fuente de energía y alarmas", "ECG", "PANI", "SpO2", "CO2FE", "Bomba de infusión",
      ],
      signosBasales: { ta: "118/76", fc: "72", fr: "16", temp: "36.4", spo2: "98" },
      medicacionPreanestesica: [
        { medicamento: "Midazolam", dosis: "2 mg", via: "IV", fecha: "20/07/26", hora: "08:50", efecto: "Ansiólisis adecuada" },
      ],
      evalObservaciones: "Paciente en ayuno de 8 horas, tranquila, vía aérea sin datos de dificultad prevista.",
      horasAyuno: "8 h",
      premedicacion: true,
      premedicacionDetalle: "Midazolam 2 mg IV",
      accesoVenoso: true,
      accesoSitio: "Dorso de mano izquierda",
      calibreCateter: "20 G",
      posicionPaciente: "Supinación",
      posicionBrazos: "Aducción",
      proteccionOjos: true,
      proteccionProminencias: true,
      torniquete: false,
      tecnicaAnestesica: "General",
      anestesiaGeneral: {
        induccion: "Intravenosa",
        medicamento: "Propofol 130 mg, fentanil 200 µg, rocuronio 35 mg",
        intubacion: "Oral",
        canula: "7.0 mm",
        globo: "Presión normal",
        traumatica: "No",
        ventilacion: "Mecánica controlada",
        volumenCorriente: "420 mL",
        frecuencia: "12 rpm",
        presionVias: "17 cmH2O",
        flujos: "O2 2 L/min · aire 2 L/min",
        peep: "5",
        circuito: "Circular semicerrado",
      },
      agentes: "Sevoflurano 2% · O2/aire",
      tiempos: {
        ingreso: "09:00", inicioAnestesia: "09:05", inicioCirugia: "09:20",
        finalCirugia: "11:10", finalAnestesia: "11:20", recuperacion: "11:25",
      },
      tipoVentilacion: "Controlada",
      egresos: { perdidasInsensibles: "180", ayuno: "500", exposicionQuirurgica: "120", diuresis: "300", sangrado: "50", otros: "0", total: "1150" },
      ingresos: { cristaloides: "1400", coloides: "0", sangre: "0", plasma: "0", otros: "0", total: "1400" },
      balanceHidrico: "+250 mL",
      aldreteFinal: 9,
      pasaA: "Recuperación",
    },
  });
  // Cuadrícula de signos vitales cada 10 minutos: es lo que grafica el PDF.
  const lecturasDemo = Array.from({ length: 14 }, (_, i) => {
    const minuto = i * 10;
    const t = i / 3;
    return {
      registroId: registro.id,
      minuto,
      hora: `${String(9 + Math.floor((0 + minuto) / 60)).padStart(2, "0")}:${String(minuto % 60).padStart(2, "0")}`,
      taSistolica: 116 + Math.round(10 * Math.sin(t)),
      taDiastolica: 74 + Math.round(6 * Math.sin(t + 0.4)),
      fc: 70 + Math.round(9 * Math.sin(t + 0.8)),
      fr: 13 + (i % 3),
      spo2: 97 + (i % 3),
      etco2: String(33 + (i % 3)),
      pvcPam: String(86 + (i % 4)),
      bis: String(42 + (i % 5)),
    };
  });
  await prisma.transanestesicoLectura.createMany({ data: lecturasDemo });
  await prisma.transanestesicoFarmaco.createMany({
    data: [
      { registroId: registro.id, orden: 1, nombre: "Propofol", dosis: "130 mg", via: "IV" },
      { registroId: registro.id, orden: 2, nombre: "Fentanil", dosis: "200 µg", via: "IV" },
      { registroId: registro.id, orden: 3, nombre: "Rocuronio", dosis: "35 mg", via: "IV" },
      { registroId: registro.id, orden: 4, nombre: "Dexametasona", dosis: "8 mg", via: "IV" },
      { registroId: registro.id, orden: 5, nombre: "Ketorolaco", dosis: "30 mg", via: "IV" },
      { registroId: registro.id, orden: 6, nombre: "Ondansetrón", dosis: "4 mg", via: "IV" },
    ],
  });
  await prisma.registroAnestesico.update({
    where: { id: registro.id },
    data: { estado: "FIRMADA", fechaFirma: new Date("2026-07-20T11:30:00-06:00") },
  });

  // ── Nota post-anestésica (hoja oficial 19) ──
  await prisma.notaPostanestesica.create({
    data: {
      expedienteQxId: qx.id,
      pacienteId: paciente.id,
      anestesiologoId: usuarioAnest.id,
      aldrete: {
        "0": { actividad: 1, respiracion: 2, circulacion: 2, conciencia: 1, saturacion: 1 },
        "5": { actividad: 2, respiracion: 2, circulacion: 2, conciencia: 2, saturacion: 1 },
        "10": { actividad: 2, respiracion: 2, circulacion: 2, conciencia: 2, saturacion: 2 },
        "20": { actividad: 2, respiracion: 2, circulacion: 2, conciencia: 2, saturacion: 2 },
      },
      ramsay: 2,
      bromage: 0,
      nota:
        "Paciente egresa de quirófano bajo efecto residual de anestesia general balanceada, extubada en sala, con ventilación espontánea y mecánica ventilatoria adecuada. Hemodinámicamente estable. Aldrete 10 a los 10 minutos de vigilancia. Sin náusea ni vómito. Dolor 2/10 en escala visual análoga. Taponamiento nasal anterior sin sangrado activo.",
      planOxigeno: "Puntas nasales 3 L/min durante 2 horas",
      planSolucionesIV: "Solución Hartmann 1000 mL para 8 horas",
      planMedicamentos: "Ketorolaco 30 mg IV c/8 h · Ondansetrón 4 mg IV c/8 h por razón necesaria",
      planComponentesSanguineos: "No requiere",
      planManejoDolor: "Analgesia multimodal; rescate con nalbufina 5 mg IV si EVA mayor a 6",
      motivoEgreso: "Aldrete 10, estable, sin dolor significativo ni sangrado",
      pasaA: "Habitación",
      fechaHora: new Date("2026-07-20T11:45:00-06:00"),
      estado: "FIRMADA",
      fechaFirma: new Date("2026-07-20T11:50:00-06:00"),
    },
  });

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

  const anestFinal = await prisma.usuario.findUniqueOrThrow({
    where: { id: usuarioAnest.id },
    select: { email: true },
  });
  console.log(`\nRegistro demo completo:`);
  console.log(`  Paciente: María Guadalupe Ejemplo De Prueba — ${paciente.numeroExpediente} (id ${paciente.id})`);
  console.log(`  Médico tratante del expediente: ${usuarioDoc.email}`);
  console.log(`  Anestesiólogo de la cirugía:    ${anestFinal.email}`);
  if (usuarioDoc.email === "doctor.demo@medicaltower.mx") {
    console.log(`  Contraseñas .demo: DoctorDemo2026! / EnfermeriaDemo2026! / AnestesiaDemo2026!`);
    console.log(`  (Con «npm run seed:usuarios» el paciente se asigna a las cuentas de prueba.)`);
  } else {
    console.log(`  Contraseña de las cuentas de prueba: ver «npm run seed:usuarios».`);
  }
  console.log(`  Receta: ${folio}`);
  console.log(`  Prescripción, órdenes médicas, consumo de quirófano y las 3 hojas de anestesiología: cargadas`);
}

main().finally(() => prisma.$disconnect());
