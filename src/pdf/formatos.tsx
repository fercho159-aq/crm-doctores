import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

// Formatos MIT generados desde la app (basados en los formatos oficiales del establecimiento).

export type Establecimiento = { razonSocial: string; domicilio: string; telefono: string; logotipo?: string | null };
export type MedicoPdf = {
  nombre: string;
  cedulaProfesional: string;
  especialidad?: string | null;
  cedulaEspecialidad?: string | null;
  firmaDigitalizada?: string | null;
};
export type PacientePdf = {
  nombre: string;
  expediente: string;
  edad: string;
  sexo: string;
  fechaNacimiento?: string;
  domicilio?: string | null;
  telefono?: string | null;
};

export const f = StyleSheet.create({
  page: { padding: 34, fontSize: 9, fontFamily: "Helvetica", color: "#16202e" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 2, borderBottomColor: "#1e5aa8", paddingBottom: 8, marginBottom: 8 },
  logoBox: { flexDirection: "row", alignItems: "center", gap: 6 },
  brand: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#1e5aa8" },
  brandSub: { fontSize: 7, color: "#2aa8a0", letterSpacing: 1.5 },
  hAddr: { fontSize: 7, color: "#555", textAlign: "right", maxWidth: 220 },
  titulo: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#1e5aa8", textAlign: "center", marginVertical: 6 },
  seccion: { backgroundColor: "#1e5aa8", color: "#ffffff", fontFamily: "Helvetica-Bold", fontSize: 8.5, paddingVertical: 3, paddingHorizontal: 6, marginTop: 8, marginBottom: 4, borderRadius: 2 },
  fila: { flexDirection: "row", flexWrap: "wrap", marginBottom: 2 },
  et: { fontFamily: "Helvetica-Bold", fontSize: 8.5 },
  val: { fontSize: 9 },
  parrafo: { marginBottom: 5, lineHeight: 1.4, textAlign: "justify" },
  campo: { marginBottom: 4 },
  campoEt: { fontSize: 7, color: "#666", fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  campoVal: { fontSize: 9, lineHeight: 1.35 },
  firmas: { flexDirection: "row", justifyContent: "space-around", marginTop: 34 },
  firmaCol: { alignItems: "center", width: 200 },
  firmaLinea: { borderTopWidth: 1, borderTopColor: "#16202e", width: 190, paddingTop: 3, alignItems: "center" },
  pie: { position: "absolute", bottom: 22, left: 34, right: 34 },
  pieTexto: { fontSize: 6.5, color: "#777", textAlign: "center", fontStyle: "italic" },
});

export function Encabezado({ est, titulo }: { est: Establecimiento; titulo: string }) {
  return (
    <>
      <View style={f.header} fixed>
        <View style={f.logoBox}>
          {est.logotipo ? <Image src={est.logotipo} style={{ width: 70 }} /> : null}
          <View>
            <Text style={f.brand}>MIT</Text>
            <Text style={f.brandSub}>MEDICAL TOWER</Text>
          </View>
        </View>
        <View>
          <Text style={[f.hAddr, { fontFamily: "Helvetica-Bold" }]}>{est.razonSocial}</Text>
          <Text style={f.hAddr}>{est.domicilio}</Text>
          <Text style={f.hAddr}>Tel: {est.telefono}</Text>
        </View>
      </View>
      <Text style={f.titulo}>{titulo}</Text>
    </>
  );
}

export function PieLegal({ folio, fecha, hash }: { folio?: string; fecha: string; hash?: string }) {
  return (
    <View style={f.pie} fixed>
      <Text style={f.pieTexto}>
        Este pertenece a un documento legal, el cual solo es utilizado con fines establecidos en el aviso de privacidad.
        Documento generado electrónicamente en el sistema MIT — Medical Tower{folio ? ` · ${folio}` : ""} · {fecha}
        {hash ? ` · SHA-256 ${hash.slice(0, 16)}…` : ""}
      </Text>
    </View>
  );
}

export function Campo({ et, val }: { et: string; val?: string | null }) {
  if (!val) return null;
  return (
    <View style={f.campo} wrap={false}>
      <Text style={f.campoEt}>{et}</Text>
      <Text style={f.campoVal}>{val}</Text>
    </View>
  );
}

export function LineaDato({ et, val }: { et: string; val?: string | null }) {
  return (
    <View style={[f.fila, { marginRight: 12 }]}>
      <Text style={f.et}>{et}: </Text>
      <Text style={f.val}>{val ?? "—"}</Text>
    </View>
  );
}

export function FirmaMedico({ medico, etiqueta = "Nombre, firma y cédula del médico" }: { medico: MedicoPdf; etiqueta?: string }) {
  return (
    <View style={f.firmaCol}>
      {medico.firmaDigitalizada ? (
        <Image src={medico.firmaDigitalizada} style={{ width: 120, height: 42, objectFit: "contain" }} />
      ) : (
        <View style={{ height: 42 }} />
      )}
      <View style={f.firmaLinea}>
        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>{medico.nombre}</Text>
        <Text style={{ fontSize: 7, color: "#555" }}>Céd. Prof. {medico.cedulaProfesional}{medico.cedulaEspecialidad ? ` · Céd. Esp. ${medico.cedulaEspecialidad}` : ""}</Text>
        <Text style={{ fontSize: 7, color: "#777" }}>{etiqueta}</Text>
      </View>
    </View>
  );
}

// Línea de firma: si `firma` (data-URL capturada en tableta) existe, se incrusta la rúbrica;
// si no, queda el espacio para firma autógrafa en papel.
export function FirmaEnBlanco({ titulo, subtitulo, firma }: { titulo: string; subtitulo?: string; firma?: string | null }) {
  return (
    <View style={f.firmaCol}>
      {firma ? (
        <Image src={firma} style={{ width: 130, height: 42, objectFit: "contain" }} />
      ) : (
        <View style={{ height: 42 }} />
      )}
      <View style={f.firmaLinea}>
        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>{titulo}</Text>
        {subtitulo ? <Text style={{ fontSize: 7, color: "#777" }}>{subtitulo}</Text> : null}
      </View>
    </View>
  );
}

export function FichaPaciente({ p, fecha }: { p: PacientePdf; fecha: string }) {
  return (
    <>
      <Text style={f.seccion}>FICHA DE IDENTIFICACIÓN</Text>
      <View style={f.fila}>
        <LineaDato et="Nombre" val={p.nombre} />
        <LineaDato et="Expediente" val={p.expediente} />
        <LineaDato et="Fecha" val={fecha} />
      </View>
      <View style={f.fila}>
        <LineaDato et="Edad" val={p.edad} />
        <LineaDato et="Sexo" val={p.sexo} />
        {p.fechaNacimiento ? <LineaDato et="Fecha de nacimiento" val={p.fechaNacimiento} /> : null}
        {p.telefono ? <LineaDato et="Teléfono" val={p.telefono} /> : null}
      </View>
      {p.domicilio ? (
        <View style={f.fila}>
          <LineaDato et="Domicilio" val={p.domicilio} />
        </View>
      ) : null}
    </>
  );
}

// ─────────────── 1. HISTORIA CLÍNICA (hoja de primer llenado, NOM-004 6.1) ───────────────

export type HistoriaClinicaData = {
  est: Establecimiento;
  paciente: PacientePdf & {
    estadoCivil?: string | null; ocupacion?: string | null; escolaridad?: string | null;
    religion?: string | null; nacionalidad?: string | null; referencia?: string | null;
    tipoSangre?: string | null; curp?: string | null; derechohabiencia?: string | null;
    contactoEmergencia?: string | null;
  };
  hoja: {
    version: number;
    capturadoPor: string;
    fechaCaptura: string;
    motivoConsulta?: string | null;
    padecimientoActual?: string | null;
    heredofamiliares?: string | null;
    patologicos?: string | null;
    noPatologicos?: string | null;
    ginecoObstetricos?: string | null;
    alergias?: string | null;
    medicamentos?: string | null;
    interrogatorio?: string | null;
    cirugiaDeseada?: string | null;
    presupuesto?: string | null;
    fechaProgramada?: string | null;
    signos: string;
  };
  fecha: string;
  hash?: string;
};

export function HistoriaClinicaPdf({ d }: { d: HistoriaClinicaData }) {
  const p = d.paciente;
  return (
    <Document title={`Historia clínica ${p.expediente}`}>
      <Page size="LETTER" style={f.page}>
        <Encabezado est={d.est} titulo="HISTORIA CLÍNICA" />
        <FichaPaciente p={p} fecha={d.fecha} />
        <View style={f.fila}>
          <LineaDato et="CURP" val={p.curp} />
          <LineaDato et="Estado civil" val={p.estadoCivil} />
          <LineaDato et="Ocupación" val={p.ocupacion} />
          <LineaDato et="Escolaridad" val={p.escolaridad} />
        </View>
        <View style={f.fila}>
          <LineaDato et="Religión" val={p.religion} />
          <LineaDato et="Nacionalidad" val={p.nacionalidad} />
          <LineaDato et="Tipo de sangre" val={p.tipoSangre} />
          <LineaDato et="Referencia" val={p.referencia} />
          <LineaDato et="Derechohabiencia" val={p.derechohabiencia} />
        </View>
        {p.contactoEmergencia ? <LineaDato et="Contacto de emergencia" val={p.contactoEmergencia} /> : null}

        <Text style={f.seccion}>PADECIMIENTO ACTUAL</Text>
        <Campo et="Motivo de consulta" val={d.hoja.motivoConsulta} />
        <Campo et="Descripción" val={d.hoja.padecimientoActual} />

        <Text style={f.seccion}>ANTECEDENTES HEREDO FAMILIARES</Text>
        <Text style={f.campoVal}>{d.hoja.heredofamiliares ?? "Sin datos referidos."}</Text>
        <Text style={f.seccion}>ANTECEDENTES PERSONALES PATOLÓGICOS</Text>
        <Text style={f.campoVal}>{d.hoja.patologicos ?? "Sin datos referidos."}</Text>
        <Text style={f.seccion}>ANTECEDENTES PERSONALES NO PATOLÓGICOS</Text>
        <Text style={f.campoVal}>{d.hoja.noPatologicos ?? "Sin datos referidos."}</Text>
        {d.hoja.ginecoObstetricos ? (
          <>
            <Text style={f.seccion}>ANTECEDENTES GINECO-OBSTÉTRICOS</Text>
            <Text style={f.campoVal}>{d.hoja.ginecoObstetricos}</Text>
          </>
        ) : null}

        <View style={{ borderWidth: 1.5, borderColor: "#c0392b", borderRadius: 3, padding: 5, marginTop: 6 }} wrap={false}>
          <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#c0392b" }}>ALERGIAS</Text>
          <Text style={f.campoVal}>{d.hoja.alergias ?? "No registradas"}</Text>
        </View>
        <Campo et="Medicamentos actuales" val={d.hoja.medicamentos} />

        {d.hoja.interrogatorio ? (
          <>
            <Text style={f.seccion}>INTERROGATORIO POR APARATOS Y SISTEMAS</Text>
            <Text style={f.campoVal}>{d.hoja.interrogatorio}</Text>
          </>
        ) : null}

        <Text style={f.seccion}>EXPLORACIÓN FÍSICA — SIGNOS VITALES Y SOMATOMETRÍA</Text>
        <Text style={f.campoVal}>{d.hoja.signos}</Text>

        {d.hoja.cirugiaDeseada || d.hoja.presupuesto ? (
          <>
            <Text style={f.seccion}>CIRUGÍA DESEADA (CONTACTO INICIAL)</Text>
            <View style={f.fila}>
              <LineaDato et="Cirugía deseada" val={d.hoja.cirugiaDeseada} />
              <LineaDato et="Presupuesto" val={d.hoja.presupuesto} />
              <LineaDato et="Fecha programada" val={d.hoja.fechaProgramada} />
            </View>
          </>
        ) : null}

        <View style={f.fila}>
          <Text style={{ fontSize: 7.5, color: "#555", marginTop: 8 }}>
            Capturó: {d.hoja.capturadoPor} · {d.hoja.fechaCaptura} · Versión {d.hoja.version} (cerrada e inmutable)
          </Text>
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ─────────────── 2. NOTA DE EVOLUCIÓN (NOM-004 6.2) ───────────────

export type NotaEvolucionData = {
  est: Establecimiento;
  paciente: PacientePdf;
  medico: MedicoPdf;
  nota: {
    fechaHora: string;
    subjetivo?: string | null;
    objetivo?: string | null;
    estudios?: string | null;
    diagnosticos?: string | null;
    pronostico?: string | null;
    plan?: string | null;
    adendas: { fechaHora: string; autor: string; texto: string }[];
  };
  fecha: string;
  hash?: string;
};

export function NotaEvolucionPdf({ d }: { d: NotaEvolucionData }) {
  return (
    <Document title={`Nota de evolución ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.page}>
        <Encabezado est={d.est} titulo="NOTA DE EVOLUCIÓN" />
        <FichaPaciente p={d.paciente} fecha={d.nota.fechaHora} />
        <Text style={f.seccion}>NOTA (FORMATO SOAP)</Text>
        <Campo et="S — Subjetivo" val={d.nota.subjetivo} />
        <Campo et="O — Objetivo / exploración física" val={d.nota.objetivo} />
        <Campo et="Resultados de estudios de laboratorio y gabinete" val={d.nota.estudios} />
        <Campo et="A — Diagnóstico(s)" val={d.nota.diagnosticos} />
        <Campo et="P — Plan de tratamiento (medicamento, dosis, vía y periodicidad)" val={d.nota.plan} />
        <Campo et="Pronóstico" val={d.nota.pronostico} />
        {d.nota.adendas.length > 0 ? (
          <>
            <Text style={f.seccion}>ADENDAS</Text>
            {d.nota.adendas.map((a, i) => (
              <View key={i} style={{ marginBottom: 4, paddingLeft: 6, borderLeftWidth: 2, borderLeftColor: "#e0a800" }}>
                <Text style={{ fontSize: 7.5, color: "#666" }}>{a.fechaHora} — {a.autor}</Text>
                <Text style={f.campoVal}>{a.texto}</Text>
              </View>
            ))}
          </>
        ) : null}
        <View style={f.firmas}>
          <FirmaMedico medico={d.medico} />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ─────────────── 3. DESCRIPCIÓN DEL PROCEDIMIENTO QUIRÚRGICO (pre + post, NOM-004 8.5/8.8) ───────────────

export type NotaQuirurgicaData = {
  est: Establecimiento;
  paciente: PacientePdf;
  medico: MedicoPdf;
  qx: {
    fechaProgramada?: string | null;
    quirofano?: string | null;
    estado: string;
    consentimientoFecha?: string | null;
  };
  pre?: {
    fechaHora: string;
    diagnostico?: string | null;
    plan?: string | null;
    tipo?: string | null;
    riesgo?: string | null;
    cuidados?: string | null;
    pronostico?: string | null;
  } | null;
  post?: {
    fechaHora: string;
    diagnosticoPre?: string | null;
    operacionPlaneada?: string | null;
    operacionRealizada?: string | null;
    diagnosticoPost?: string | null;
    tecnica?: string | null;
    hallazgos?: string | null;
    conteoGasas?: string | null;
    incidentes?: string | null;
    sangrado?: string | null;
    transfusiones?: string | null;
    estudios?: string | null;
    equipo?: string | null;
    estadoPost?: string | null;
    plan?: string | null;
    pronostico?: string | null;
    patologia?: string | null;
  } | null;
  fecha: string;
  hash?: string;
};

export function NotaQuirurgicaPdf({ d }: { d: NotaQuirurgicaData }) {
  return (
    <Document title={`Expediente quirúrgico ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.page}>
        <Encabezado est={d.est} titulo="EXPEDIENTE QUIRÚRGICO — NOTAS PRE Y POSTOPERATORIA" />
        <FichaPaciente p={d.paciente} fecha={d.fecha} />
        <View style={f.fila}>
          <LineaDato et="Cirugía programada" val={d.qx.fechaProgramada} />
          <LineaDato et="Quirófano / sede" val={d.qx.quirofano} />
          <LineaDato et="Estado" val={d.qx.estado} />
          <LineaDato et="Consentimiento recabado" val={d.qx.consentimientoFecha} />
        </View>

        {d.pre ? (
          <>
            <Text style={f.seccion}>NOTA PREOPERATORIA (NOM-004 8.5) — {d.pre.fechaHora}</Text>
            <Campo et="Diagnóstico preoperatorio" val={d.pre.diagnostico} />
            <Campo et="Plan quirúrgico (operación proyectada)" val={d.pre.plan} />
            <View style={f.fila}>
              <LineaDato et="Tipo de cirugía" val={d.pre.tipo} />
              <LineaDato et="Riesgo quirúrgico" val={d.pre.riesgo} />
            </View>
            <Campo et="Cuidados y plan terapéutico preoperatorio" val={d.pre.cuidados} />
            <Campo et="Pronóstico" val={d.pre.pronostico} />
          </>
        ) : null}

        {d.post ? (
          <>
            <Text style={f.seccion}>DESCRIPCIÓN DEL PROCEDIMIENTO QUIRÚRGICO — NOTA POSTOPERATORIA (NOM-004 8.8) — {d.post.fechaHora}</Text>
            <Campo et="Diagnóstico preoperatorio" val={d.post.diagnosticoPre} />
            <Campo et="Operación planeada" val={d.post.operacionPlaneada} />
            <Campo et="Operación realizada" val={d.post.operacionRealizada} />
            <Campo et="Diagnóstico postoperatorio" val={d.post.diagnosticoPost} />
            <Campo et="Técnica quirúrgica" val={d.post.tecnica} />
            <Campo et="Hallazgos operatorios / transoperatorios" val={d.post.hallazgos} />
            <Campo et="Sangrado y cuenta de gasas, compresas e instrumental" val={`${d.post.sangrado ?? "—"} · ${d.post.conteoGasas ?? "—"}`} />
            <Campo et="Incidentes y accidentes" val={d.post.incidentes} />
            <Campo et="Transfusiones" val={d.post.transfusiones} />
            <Campo et="Estudios transoperatorios" val={d.post.estudios} />
            <Campo et="Estado postquirúrgico inmediato y plan de manejo" val={`${d.post.estadoPost ?? "—"} · ${d.post.plan ?? "—"}`} />
            <Campo et="Pronóstico" val={d.post.pronostico} />
            <Campo et="Envío de piezas para estudio histopatológico" val={d.post.patologia} />
            <Text style={f.seccion}>EQUIPO QUIRÚRGICO</Text>
            <Text style={f.campoVal}>{d.post.equipo ?? "—"}</Text>
          </>
        ) : null}

        <View style={f.firmas}>
          <FirmaMedico medico={d.medico} etiqueta="Cirujano responsable — nombre, firma y cédula" />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ─────────────── 4. CARTA DE CONSENTIMIENTO BAJO INFORMACIÓN (quirúrgico) ───────────────

export type ConsentimientoQxData = {
  est: Establecimiento;
  paciente: PacientePdf;
  medico: MedicoPdf;
  diagnostico: string;
  actoPropuesto: string;
  riesgos: string;
  firmas?: {
    paciente?: string | null;
    responsable?: string | null;
    testigo?: string | null;
    nombreResponsable?: string | null;
    nombreTestigo?: string | null;
  };
  fecha: string;
  hash?: string;
};

export function ConsentimientoQxPdf({ d }: { d: ConsentimientoQxData }) {
  return (
    <Document title={`Consentimiento informado ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.page}>
        <Encabezado est={d.est} titulo="CARTA DE CONSENTIMIENTO BAJO INFORMACIÓN" />
        <View style={f.fila}>
          <LineaDato et="Nombre" val={d.paciente.nombre} />
          <LineaDato et="Edad" val={d.paciente.edad} />
          <LineaDato et="Expediente" val={d.paciente.expediente} />
        </View>
        <View style={f.fila}>
          <LineaDato et="Nombre del médico tratante" val={d.medico.nombre} />
          <LineaDato et="Cédula" val={d.medico.cedulaProfesional} />
        </View>
        <LineaDato et="Diagnóstico" val={d.diagnostico} />
        <LineaDato et="Fecha" val={d.fecha} />

        <Text style={f.seccion}>ACTO MÉDICO QUIRÚRGICO PROPUESTO</Text>
        <Text style={f.parrafo}>{d.actoPropuesto}</Text>

        <Text style={f.parrafo}>
          Quienes con nuestras firmas validamos que en este documento, manifestamos en un lenguaje simple, que el médico
          explicó el plan de manejo propuesto y cada una de las preguntas que el paciente planteó fueron resueltas, de tal
          forma que para ambos queda perfectamente claro que el procedimiento a realizar consiste en el acto médico arriba
          descrito.
        </Text>
        <Text style={f.parrafo}>
          Como un hecho sobresaliente, debe señalarse que la explicación del médico fue lo suficientemente clara para
          evidenciar los beneficios del acto médico-quirúrgico que se propone y de ser el más óptimo para su provecho al
          momento de la celebración de este consentimiento; asimismo el médico ha explicado los riesgos o desventajas que
          pueden y/o lleguen a ocurrir durante o después de este acto, los cuales se describen a continuación:
        </Text>

        <Text style={f.seccion}>RIESGOS Y POSIBLES COMPLICACIONES</Text>
        <Text style={f.parrafo}>{d.riesgos}</Text>

        <Text style={f.parrafo}>
          En forma complementaria se manifiesta que, cumpliendo con la normatividad correspondiente, el médico explicó el
          significado de la libertad prescriptiva y resolver la contingencia o urgencia que eventualmente se pudiera
          presentar, derivadas del acto médico autorizado. Este procedimiento puede ser revocado por disposición única del
          paciente o del familiar tutor del mismo, en todo momento, antes de realizar dicha intervención. A continuación se
          anexan las firmas que determinan la acción jurídica o legal con respecto al procedimiento propuesto.
        </Text>

        <View style={f.firmas}>
          <FirmaMedico medico={d.medico} etiqueta="Firma del médico" />
          <FirmaEnBlanco titulo={d.paciente.nombre} subtitulo="Nombre y firma del paciente" firma={d.firmas?.paciente} />
        </View>
        <View style={f.firmas}>
          <FirmaEnBlanco
            titulo={d.firmas?.nombreResponsable || "Nombre y firma del responsable"}
            subtitulo="(si aplica)"
            firma={d.firmas?.responsable}
          />
          <FirmaEnBlanco
            titulo={d.firmas?.nombreTestigo || "Testigo"}
            subtitulo="Nombre y firma"
            firma={d.firmas?.testigo}
          />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ─────────────── 5. CONSENTIMIENTO PARA PROCEDIMIENTO CON ANESTESIA ───────────────

export type ConsentimientoAnestesiaData = {
  est: Establecimiento;
  paciente: PacientePdf;
  anestesiologo: { nombre: string; cedula: string };
  diagnostico: string;
  actoQuirurgico: string;
  firmas?: {
    anestesiologo?: string | null;
    paciente?: string | null;
    responsable?: string | null;
    nombreResponsable?: string | null;
  };
  fecha: string;
  hash?: string;
};

export function ConsentimientoAnestesiaPdf({ d }: { d: ConsentimientoAnestesiaData }) {
  return (
    <Document title={`Consentimiento anestesia ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.page}>
        <Encabezado est={d.est} titulo="CARTA DE CONSENTIMIENTO BAJO INFORMACIÓN PARA PROCEDIMIENTO CON ANESTESIA" />
        <View style={f.fila}>
          <LineaDato et="Nombre" val={d.paciente.nombre} />
          <LineaDato et="Edad" val={d.paciente.edad} />
          <LineaDato et="Expediente" val={d.paciente.expediente} />
        </View>
        <View style={f.fila}>
          <LineaDato et="Nombre del médico anestesiólogo" val={d.anestesiologo.nombre} />
          <LineaDato et="Cédula" val={d.anestesiologo.cedula} />
        </View>
        <LineaDato et="Diagnóstico" val={d.diagnostico} />
        <LineaDato et="Acto quirúrgico proyectado" val={d.actoQuirurgico} />
        <LineaDato et="Fecha" val={d.fecha} />

        <Text style={[f.parrafo, { marginTop: 8 }]}>
          Por medio de la presente se manifiesta que se ha explicado con total satisfacción los diagnósticos, el pronóstico,
          las alternativas de tratamiento y/o sus posibles complicaciones en la aplicación del procedimiento anestésico al
          cual seré sometido.
        </Text>
        <Text style={f.parrafo}>
          Se me brindó la oportunidad de formular preguntas referentes a los conceptos antes mencionados, las cuales han
          sido resueltas en su totalidad; por lo que, autorizo incondicionalmente el servicio de anestesiología en el
          procedimiento quirúrgico que se llevará a cabo, dando por entendido los beneficios y/o complicaciones que este
          llegue a presentar.
        </Text>
        <Text style={f.parrafo}>
          Lo anterior se formaliza al final del presente con nombre y firma de los interesados, dando por enterado que dicho
          documento es irrevocable.
        </Text>

        <View style={f.firmas}>
          <FirmaEnBlanco
            titulo={d.anestesiologo.nombre}
            subtitulo={`Firma del médico anestesiólogo · Céd. ${d.anestesiologo.cedula}`}
            firma={d.firmas?.anestesiologo}
          />
          <FirmaEnBlanco titulo={d.paciente.nombre} subtitulo="Nombre y firma del paciente" firma={d.firmas?.paciente} />
        </View>
        <View style={f.firmas}>
          <FirmaEnBlanco
            titulo={d.firmas?.nombreResponsable || "Nombre y firma del responsable"}
            subtitulo="(si aplica; en caso de no otorgar el consentimiento, explicar el motivo)"
            firma={d.firmas?.responsable}
          />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ─────────────── 6. HOJA DE AUTORIZACIÓN, SOLICITUD Y REGISTRO DE INTERVENCIÓN QUIRÚRGICA ───────────────

export type AutorizacionQxData = {
  est: Establecimiento;
  paciente: PacientePdf;
  medico: MedicoPdf;
  servicio: string;
  diagnosticoPre: string;
  operacionProyectada: string;
  tipoOperacion: string; // Electiva | Urgente
  anestesiaPlaneada: string; // Local | Regional | General
  sangre?: string | null;
  fechaCirugia?: string | null;
  horaCirugia?: string | null;
  quirofano?: string | null;
  registro?: {
    diagnosticoPost?: string | null;
    anestesiaAdministrada?: string | null;
    examenHistopatologico?: string | null;
    cirugiaEfectuada?: string | null;
  } | null;
  firmas?: {
    paciente?: string | null;
    responsable?: string | null;
    testigo?: string | null;
    nombreResponsable?: string | null;
    nombreTestigo?: string | null;
  };
  fecha: string;
  hash?: string;
};

export function AutorizacionQxPdf({ d }: { d: AutorizacionQxData }) {
  return (
    <Document title={`Autorización quirúrgica ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.page}>
        <Encabezado est={d.est} titulo="HOJA DE AUTORIZACIÓN, SOLICITUD Y REGISTRO DE INTERVENCIÓN QUIRÚRGICA" />
        <View style={f.fila}>
          <LineaDato et="Nombre" val={d.paciente.nombre} />
          <LineaDato et="Expediente" val={d.paciente.expediente} />
          <LineaDato et="Edad" val={d.paciente.edad} />
          <LineaDato et="Sexo" val={d.paciente.sexo} />
          <LineaDato et="Servicio" val={d.servicio} />
        </View>
        {d.paciente.domicilio ? <LineaDato et="Domicilio" val={d.paciente.domicilio} /> : null}

        <Text style={f.seccion}>AUTORIZACIÓN DEL PACIENTE</Text>
        <Text style={f.parrafo}>
          Autorizo al personal médico para la realización de procedimientos quirúrgicos en las instalaciones denominadas
          como &quot;Medical Tower&quot; los cuales son necesarios para el tratamiento de mi enfermedad o estado clínico,
          entendiendo que no desconozco los riesgos, como anteriormente quedó asentado en la firma de anteriores
          documentos, por lo cual autorizo el procedimiento quirúrgico y anestésico.
        </Text>
        <View style={f.firmas}>
          <FirmaEnBlanco titulo={d.paciente.nombre} subtitulo="Nombre y firma del paciente" firma={d.firmas?.paciente} />
          <FirmaEnBlanco
            titulo={d.firmas?.nombreResponsable || "Nombre y firma del responsable legal"}
            subtitulo="(si aplica)"
            firma={d.firmas?.responsable}
          />
          <FirmaEnBlanco
            titulo={d.firmas?.nombreTestigo || "Nombre y firma de testigo"}
            firma={d.firmas?.testigo}
          />
        </View>

        <Text style={f.seccion}>SOLICITUD DE OPERACIÓN</Text>
        <Campo et="Diagnóstico preoperatorio" val={d.diagnosticoPre} />
        <View style={f.fila}>
          <LineaDato et="Operación proyectada" val={d.operacionProyectada} />
        </View>
        <View style={f.fila}>
          <LineaDato et="Tipo" val={d.tipoOperacion} />
          <LineaDato et="Anestesia planeada" val={d.anestesiaPlaneada} />
          <LineaDato et="Sangre" val={d.sangre} />
        </View>

        <Text style={f.seccion}>PROGRAMACIÓN DEL QUIRÓFANO</Text>
        <View style={f.fila}>
          <LineaDato et="Fecha" val={d.fechaCirugia} />
          <LineaDato et="Hora" val={d.horaCirugia} />
          <LineaDato et="Quirófano" val={d.quirofano} />
        </View>

        <Text style={f.seccion}>REGISTRO DE OPERACIÓN</Text>
        <Campo et="Diagnóstico postoperatorio" val={d.registro?.diagnosticoPost ?? " "} />
        <Campo et="Anestesia administrada" val={d.registro?.anestesiaAdministrada ?? " "} />
        <Campo et="Examen histopatológico y/o auxiliares de diagnóstico" val={d.registro?.examenHistopatologico ?? " "} />
        <Campo et="Cirugía efectuada" val={d.registro?.cirugiaEfectuada ?? " "} />

        <View style={f.firmas}>
          <FirmaMedico medico={d.medico} etiqueta="Cirujano responsable" />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}
