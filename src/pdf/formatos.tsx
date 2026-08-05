import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

// Formatos MIT generados desde la app (basados en los formatos oficiales del establecimiento).

export type Establecimiento = {
  razonSocial: string;
  domicilio: string;
  telefono: string;
  logotipo?: string | null;
  licenciaSanitaria?: string | null;
  rfc?: string | null;
  expedienteCofepris?: string | null;
  oficioCofepris?: string | null;
};
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
  // Hojas que el papel imprime a página completa (consumo, anestesiología):
  // márgenes estrechos para que quepan sin partirse en dos.
  pageDensa: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 30, fontSize: 9, fontFamily: "Helvetica", color: "#16202e" },
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
  pie: { position: "absolute", bottom: 14, left: 22, right: 22 },
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
          {est.licenciaSanitaria ? (
            <Text style={[f.hAddr, { fontFamily: "Helvetica-Bold" }]}>LICENCIA SANITARIA {est.licenciaSanitaria}</Text>
          ) : null}
          {est.expedienteCofepris || est.oficioCofepris ? (
            <Text style={f.hAddr}>
              {est.expedienteCofepris ? `Expediente: ${est.expedienteCofepris}` : ""}
              {est.expedienteCofepris && est.oficioCofepris ? "   " : ""}
              {est.oficioCofepris ? `Oficio: ${est.oficioCofepris}` : ""}
            </Text>
          ) : null}
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

// ─────────────── Primitivas para replicar los formatos tabulares en papel ───────────────
// Los formatos oficiales son cuadrículas y listas de casillas. `Tabla` dibuja el
// borde superior e izquierdo y cada celda su borde derecho e inferior, con lo que
// la rejilla queda de un solo trazo sin líneas dobles.

const AZUL = "#1e5aa8";
const AZUL_CLARO = "#dbe8f7";
const RAYA = "#9db8d8";

// `Style` no se reexporta desde @react-pdf/renderer; se deriva de las props de View.
export type Estilo = Exclude<NonNullable<React.ComponentProps<typeof View>["style"]>, unknown[]>;

export const t = StyleSheet.create({
  tabla: { borderTopWidth: 0.7, borderLeftWidth: 0.7, borderColor: AZUL, marginBottom: 5 },
  fila: { flexDirection: "row", alignItems: "stretch" },
  celda: {
    borderRightWidth: 0.7,
    borderBottomWidth: 0.7,
    borderColor: AZUL,
    paddingVertical: 2.5,
    paddingHorizontal: 3,
    justifyContent: "center",
  },
  th: { backgroundColor: AZUL_CLARO },
  thTexto: { fontFamily: "Helvetica-Bold", fontSize: 7 },
  tdTexto: { fontSize: 7.5 },
  cajaTitulo: {
    backgroundColor: AZUL_CLARO,
    borderWidth: 0.7,
    borderColor: AZUL,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: AZUL,
    paddingVertical: 2.5,
    paddingHorizontal: 4,
    marginTop: 5,
  },
});

type CeldaProps = {
  children?: React.ReactNode;
  /** Peso de la columna (flex). Omitir `w` reparte el espacio en partes iguales. */
  w?: number;
  align?: "left" | "center" | "right";
  alto?: number;
  /** Tamaño de letra: los formatos con más de 40 renglones por página bajan a 5.5. */
  fuente?: number;
  /** Compacta el relleno de la celda para las tablas de muchos renglones. */
  denso?: boolean;
  style?: Estilo;
};

export function Tabla({ children, style }: { children: React.ReactNode; style?: Estilo }) {
  return <View style={[t.tabla, style ?? {}]}>{children}</View>;
}

export function Fila({ children, style }: { children: React.ReactNode; style?: Estilo }) {
  return <View style={[t.fila, style ?? {}]}>{children}</View>;
}

function celda(
  fondo: Estilo,
  texto: Estilo,
  { children, w = 1, align = "left", alto, fuente, denso, style }: CeldaProps,
) {
  return (
    <View
      style={[
        t.celda,
        fondo,
        { flexGrow: w, flexShrink: 1, flexBasis: 0 },
        denso ? { paddingVertical: 0.8, paddingHorizontal: 2 } : {},
        alto ? { minHeight: alto } : {},
        style ?? {},
      ]}
    >
      <Text style={[texto, { textAlign: align }, fuente ? { fontSize: fuente } : {}]}>{children ?? " "}</Text>
    </View>
  );
}

export function Th(props: CeldaProps) {
  return celda(t.th, t.thTexto, { align: "center", ...props });
}

export function Td(props: CeldaProps) {
  return celda({}, t.tdTexto, { alto: 12, ...props });
}

/** Celda que contiene componentes (casillas, sub-tablas) en lugar de texto. */
export function TdVista({ children, w = 1, alto, style }: CeldaProps) {
  return (
    <View style={[t.celda, { flexGrow: w, flexShrink: 1, flexBasis: 0 }, alto ? { minHeight: alto } : {}, style ?? {}]}>
      {children}
    </View>
  );
}

/** Título de bloque con fondo, como los recuadros del formato impreso. */
export function TituloBloque({ children }: { children: React.ReactNode }) {
  return <Text style={t.cajaTitulo}>{children}</Text>;
}

/** Casilla de verificación: cuadro relleno = marcada (evita glifos ☒ ausentes en Helvetica). */
export function Casilla({ label, marcada, ancho }: { label?: string; marcada?: boolean | null; ancho?: number | string }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", marginRight: 7, marginBottom: 1.5 }, ancho ? { width: ancho } : {}]}>
      <View
        style={{
          width: 7,
          height: 7,
          borderWidth: 0.8,
          borderColor: "#16202e",
          marginRight: 3,
          backgroundColor: marcada ? AZUL : "#ffffff",
        }}
      />
      {label ? <Text style={{ fontSize: 7 }}>{label}</Text> : null}
    </View>
  );
}

/** Grupo horizontal de casillas (ej. «Tipo de cirugía: Mayor ☐ Menor ☐ …»). */
export function GrupoCasillas({
  et,
  opciones,
  seleccion,
}: {
  et?: string;
  opciones: string[];
  seleccion?: string[] | string | null;
}) {
  const marcadas = Array.isArray(seleccion) ? seleccion : seleccion ? [seleccion] : [];
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginBottom: 2 }}>
      {et ? <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", marginRight: 5 }}>{et}</Text> : null}
      {opciones.map((o) => (
        <Casilla key={o} label={o} marcada={marcadas.includes(o)} />
      ))}
    </View>
  );
}

/** Campo con línea de llenado, como «NOMBRE: ______________». */
export function LineaLlenado({
  et,
  val,
  w = "100%",
  compacto,
}: {
  et: string;
  val?: string | null;
  w?: number | string;
  /** Reduce interlineado y letra para los formatos con decenas de campos por hoja. */
  compacto?: boolean;
}) {
  return (
    <View
      style={[
        { flexDirection: "row", alignItems: "flex-end", marginBottom: compacto ? 0.8 : 3, paddingRight: 6 },
        { width: w },
      ]}
    >
      <Text style={{ fontSize: compacto ? 6.4 : 7.5, fontFamily: "Helvetica-Bold", color: AZUL }}>{et}: </Text>
      <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, borderBottomWidth: 0.6, borderBottomColor: AZUL }}>
        <Text style={{ fontSize: compacto ? 7 : 8.5 }}>{val || " "}</Text>
      </View>
    </View>
  );
}

/** Renglones en blanco para llenado manuscrito (el papel siempre deja espacio de sobra). */
export function Renglones({ n = 3, alto = 13 }: { n?: number; alto?: number }) {
  return (
    <View>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={{ height: alto, borderBottomWidth: 0.6, borderBottomColor: RAYA }} />
      ))}
    </View>
  );
}

/** Bloque de texto sobre renglones: imprime lo capturado y deja el resto en blanco. */
export function BloqueTexto({ val, renglones = 3 }: { val?: string | null; renglones?: number }) {
  const texto = (val ?? "").trim();
  const libres = texto ? Math.max(1, renglones - Math.ceil(texto.length / 110)) : renglones;
  return (
    <View>
      {texto ? <Text style={[f.campoVal, { marginBottom: 2 }]}>{texto}</Text> : null}
      <Renglones n={libres} />
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
export function FirmaEnBlanco({
  titulo,
  subtitulo,
  firma,
  compacta,
}: {
  titulo: string;
  subtitulo?: string;
  firma?: string | null;
  /** Reduce el espacio de rúbrica en las hojas que llenan la página completa. */
  compacta?: boolean;
}) {
  const alto = compacta ? 22 : 42;
  return (
    <View style={f.firmaCol}>
      {firma ? (
        <Image src={firma} style={{ width: 130, height: alto, objectFit: "contain" }} />
      ) : (
        <View style={{ height: alto }} />
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

// ─────────────── 7. FICHA DE IDENTIFICACIÓN (hoja oficial 2) ───────────────
// La llena recepción/administración con apoyo del paciente o familiar.

export type FichaIdentificacionData = {
  est: Establecimiento;
  paciente: PacientePdf & {
    colonia?: string | null;
    cp?: string | null;
    estadoCivil?: string | null;
  };
  diagnostico?: string | null;
  responsable?: {
    nombre?: string | null;
    parentesco?: string | null;
    domicilio?: string | null;
    telefono?: string | null;
    colonia?: string | null;
    cp?: string | null;
  } | null;
  medico?: { nombre?: string | null; consultorio?: string | null; telefono?: string | null } | null;
  firmas?: { paciente?: string | null; medico?: string | null; familiar?: string | null };
  hora?: string | null;
  fecha: string;
  hash?: string;
};

export function FichaIdentificacionPdf({ d }: { d: FichaIdentificacionData }) {
  const p = d.paciente;
  return (
    <Document title={`Ficha de identificación ${p.expediente}`}>
      <Page size="LETTER" style={f.page}>
        <Encabezado est={d.est} titulo="FICHA DE IDENTIFICACIÓN" />

        <View style={f.fila}>
          <LineaLlenado et="FECHA" val={d.fecha} w="40%" />
          <LineaLlenado et="HORA" val={d.hora} w="25%" />
          <LineaLlenado et="EXPEDIENTE" val={p.expediente} w="35%" />
        </View>
        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: AZUL, marginTop: 3 }}>DIAGNÓSTICO</Text>
        <BloqueTexto val={d.diagnostico} renglones={3} />

        <Text style={f.seccion}>DATOS DEL PACIENTE</Text>
        <LineaLlenado et="NOMBRE" val={p.nombre} />
        <View style={f.fila}>
          <LineaLlenado et="DOMICILIO" val={p.domicilio} w="65%" />
          <LineaLlenado et="TELÉFONO" val={p.telefono} w="35%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="COLONIA" val={p.colonia} w="65%" />
          <LineaLlenado et="C.P." val={p.cp} w="35%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="FECHA DE NACIMIENTO" val={p.fechaNacimiento} w="65%" />
          <LineaLlenado et="EDAD" val={p.edad} w="35%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="SEXO" val={p.sexo} w="40%" />
          <LineaLlenado et="ESTADO CIVIL" val={p.estadoCivil} w="60%" />
        </View>

        <Text style={f.seccion}>DATOS DEL RESPONSABLE DEL PACIENTE</Text>
        <View style={f.fila}>
          <LineaLlenado et="NOMBRE" val={d.responsable?.nombre} w="65%" />
          <LineaLlenado et="PARENTESCO" val={d.responsable?.parentesco} w="35%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="DOMICILIO" val={d.responsable?.domicilio} w="65%" />
          <LineaLlenado et="TELÉFONO" val={d.responsable?.telefono} w="35%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="COLONIA" val={d.responsable?.colonia} w="65%" />
          <LineaLlenado et="C.P." val={d.responsable?.cp} w="35%" />
        </View>

        <Text style={f.seccion}>DATOS DEL MÉDICO TRATANTE</Text>
        <LineaLlenado et="NOMBRE" val={d.medico?.nombre} />
        <LineaLlenado et="DIRECCIÓN DEL CONSULTORIO" val={d.medico?.consultorio} />
        <LineaLlenado et="TELÉFONOS" val={d.medico?.telefono} />

        <View style={f.firmas}>
          <FirmaEnBlanco titulo={p.nombre} subtitulo="Firma del paciente" firma={d.firmas?.paciente} />
          <FirmaEnBlanco titulo={d.medico?.nombre || " "} subtitulo="Firma del médico" firma={d.firmas?.medico} />
          <FirmaEnBlanco titulo={d.responsable?.nombre || " "} subtitulo="Firma del familiar" firma={d.firmas?.familiar} />
        </View>

        {d.est.rfc ? (
          <Text style={{ fontSize: 7, color: "#666", textAlign: "right", marginTop: 10 }}>
            {d.est.razonSocial} · RFC: {d.est.rfc}
          </Text>
        ) : null}
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ─────────────── 8. PRESCRIPCIÓN MÉDICA DE MEDICAMENTOS (hoja oficial 1) ───────────────
// Hoja de indicaciones farmacológicas del paciente hospitalizado. La llena el
// médico tratante: medicamento, dosis exacta, vía y horario.

export type PrescripcionData = {
  est: Establecimiento;
  paciente: PacientePdf;
  medico: MedicoPdf;
  cuarto?: string | null;
  diagnostico?: string | null;
  dieta?: string | null;
  partidas: { fecha: string; medicamento: string; dosis: string; via: string; horario: string }[];
  fecha: string;
  hash?: string;
};

/** Renglones mínimos de la hoja impresa: se completa con líneas en blanco. */
const RENGLONES_PRESCRIPCION = 16;

export function PrescripcionMedicaPdf({ d }: { d: PrescripcionData }) {
  const vacias = Math.max(0, RENGLONES_PRESCRIPCION - d.partidas.length);
  return (
    <Document title={`Prescripción médica ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.page}>
        <Encabezado est={d.est} titulo="PRESCRIPCIÓN MÉDICA DE MEDICAMENTOS" />

        <View style={f.fila}>
          <LineaLlenado et="NOMBRE" val={d.paciente.nombre} w="65%" />
          <LineaLlenado et="CUARTO" val={d.cuarto} w="35%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="DIAGNÓSTICO" val={d.diagnostico} w="65%" />
          <LineaLlenado et="EDAD" val={d.paciente.edad} w="35%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="DIETA" val={d.dieta} w="65%" />
          <LineaLlenado et="EXPEDIENTE" val={d.paciente.expediente} w="35%" />
        </View>

        <Tabla style={{ marginTop: 6 }}>
          <Fila>
            <Th w={1.2}>FECHA</Th>
            <Th w={4}>PRESCRIPCIÓN MÉDICA DE MEDICAMENTOS</Th>
            <Th w={1.4}>DOSIS</Th>
            <Th w={1.2}>VÍA</Th>
            <Th w={2.2}>HORARIO</Th>
          </Fila>
          {d.partidas.map((p, i) => (
            <Fila key={i}>
              <Td w={1.2} align="center">{p.fecha}</Td>
              <Td w={4}>{p.medicamento}</Td>
              <Td w={1.4} align="center">{p.dosis}</Td>
              <Td w={1.2} align="center">{p.via}</Td>
              <Td w={2.2} align="center">{p.horario}</Td>
            </Fila>
          ))}
          {Array.from({ length: vacias }, (_, i) => (
            <Fila key={`v${i}`}>
              <Td w={1.2} alto={14} />
              <Td w={4} alto={14} />
              <Td w={1.4} alto={14} />
              <Td w={1.2} alto={14} />
              <Td w={2.2} alto={14} />
            </Fila>
          ))}
        </Tabla>

        <View style={f.firmas}>
          <FirmaMedico medico={d.medico} etiqueta="Firma del médico tratante" />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ─────────────── 9. HOJA DE ÓRDENES MÉDICAS (hojas oficiales 9-10) ───────────────
// Bitácora diaria de indicaciones: dieta, cuidados de enfermería, soluciones,
// medicamentos y estudios solicitados.

export const CATEGORIA_ORDEN_LABEL: Record<string, string> = {
  DIETA: "Dieta",
  CUIDADOS: "Cuidados generales de enfermería",
  SOLUCIONES: "Soluciones intravenosas",
  MEDICAMENTOS: "Medicamentos (dosis, vía y horario)",
  ESTUDIOS: "Laboratorio y gabinete",
  OTRO: "Otras indicaciones",
};

export type OrdenesMedicasData = {
  est: Establecimiento;
  paciente: PacientePdf;
  medico: MedicoPdf;
  cuarto?: string | null;
  fechaHora: string;
  partidas: { categoria: string; texto: string }[];
  fecha: string;
  hash?: string;
};

const RENGLONES_ORDENES = 24;

export function OrdenesMedicasPdf({ d }: { d: OrdenesMedicasData }) {
  // Agrupa por categoría respetando el orden del formato impreso.
  const orden = ["DIETA", "CUIDADOS", "SOLUCIONES", "MEDICAMENTOS", "ESTUDIOS", "OTRO"];
  const grupos = orden
    .map((cat) => ({ cat, items: d.partidas.filter((p) => p.categoria === cat) }))
    .filter((g) => g.items.length > 0);
  const usados = grupos.reduce((n, g) => n + g.items.length + 1, 0);
  const vacias = Math.max(2, RENGLONES_ORDENES - usados);

  return (
    <Document title={`Órdenes médicas ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.page}>
        <Encabezado est={d.est} titulo="HOJA DE ÓRDENES MÉDICAS" />

        <Tabla>
          <Fila>
            <Th w={1}>NOMBRE</Th>
            <Td w={3}>{d.paciente.nombre}</Td>
            <Th w={1}>EXPEDIENTE</Th>
            <Td w={1.2} align="center">{d.paciente.expediente}</Td>
            <Th w={0.8}>CUARTO</Th>
            <Td w={0.8} align="center">{d.cuarto ?? ""}</Td>
          </Fila>
        </Tabla>

        <Tabla>
          <Fila>
            <Th w={1.4}>FECHA</Th>
            <Th w={6}>HOJA DE ÓRDENES MÉDICAS</Th>
          </Fila>
          {grupos.map((g) => (
            <React.Fragment key={g.cat}>
              <Fila>
                <Td w={1.4} align="center">{d.fechaHora}</Td>
                <Td w={6} style={{ backgroundColor: "#f1f6fc" }}>
                  {CATEGORIA_ORDEN_LABEL[g.cat] ?? g.cat}
                </Td>
              </Fila>
              {g.items.map((it, i) => (
                <Fila key={`${g.cat}-${i}`}>
                  <Td w={1.4} />
                  <Td w={6}>{`•  ${it.texto}`}</Td>
                </Fila>
              ))}
            </React.Fragment>
          ))}
          {Array.from({ length: vacias }, (_, i) => (
            <Fila key={`v${i}`}>
              <Td w={1.4} alto={14} />
              <Td w={6} alto={14} />
            </Fila>
          ))}
        </Tabla>

        <View style={f.firmas}>
          <FirmaMedico medico={d.medico} etiqueta="Médico que indica — nombre, firma y cédula" />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ─────────────── 10. DESCRIPCIÓN DEL PROCEDIMIENTO QUIRÚRGICO (hoja oficial 6) ───────────────
// Reproduce las nueve secciones numeradas del formato impreso y el recuadro del
// equipo quirúrgico. La llena el cirujano al terminar la intervención.

export type DescripcionQxData = {
  est: Establecimiento;
  paciente: PacientePdf;
  medico: MedicoPdf;
  tecnica?: string | null;
  hallazgos?: string | null;
  complicaciones?: string | null;
  incidentes?: string | null;
  estadoPostPlan?: string | null;
  pronostico?: string | null;
  sangradoGasas?: string | null;
  patologia?: string | null;
  equipo: {
    cirujano?: string | null;
    circulante?: string | null;
    anestesiologo?: string | null;
    primerAyudante?: string | null;
    instrumentista?: string | null;
    segundoAyudante?: string | null;
  };
  fecha: string;
  hash?: string;
};

function SeccionNumerada({ n, titulo, val, renglones = 3 }: { n: number; titulo: string; val?: string | null; renglones?: number }) {
  return (
    <View style={{ marginBottom: 3 }}>
      <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: AZUL }}>{`${n}.- ${titulo}`}</Text>
      <BloqueTexto val={val} renglones={renglones} />
    </View>
  );
}

export function DescripcionQxPdf({ d }: { d: DescripcionQxData }) {
  return (
    <Document title={`Descripción del procedimiento quirúrgico ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.page}>
        <Encabezado est={d.est} titulo="DESCRIPCIÓN DEL PROCEDIMIENTO QUIRÚRGICO" />

        <Tabla>
          <Fila>
            <Th w={1}>NOMBRE</Th>
            <Td w={3.4}>{d.paciente.nombre}</Td>
            <Th w={1}>EXPEDIENTE</Th>
            <Td w={1.2} align="center">{d.paciente.expediente}</Td>
            <Th w={0.6}>EDAD</Th>
            <Td w={0.8} align="center">{d.paciente.edad}</Td>
          </Fila>
        </Tabla>

        <SeccionNumerada n={1} titulo="TÉCNICA" val={d.tecnica} renglones={6} />
        <SeccionNumerada n={2} titulo="HALLAZGOS OPERATORIOS" val={d.hallazgos} renglones={2} />
        <SeccionNumerada n={3} titulo="COMPLICACIONES TRANSOPERATORIAS" val={d.complicaciones} renglones={2} />
        <SeccionNumerada n={4} titulo="INCIDENTES Y ACCIDENTES" val={d.incidentes} renglones={2} />
        <SeccionNumerada n={5} titulo="ESTADO POSTQUIRÚRGICO INMEDIATO Y PLAN DE MANEJO" val={d.estadoPostPlan} renglones={2} />
        <SeccionNumerada n={6} titulo="PRONÓSTICO" val={d.pronostico} renglones={1} />
        <SeccionNumerada n={7} titulo="SANGRADO Y CUENTA DE GASAS" val={d.sangradoGasas} renglones={2} />
        <SeccionNumerada n={8} titulo="ENVÍO DE PIEZAS PARA ESTUDIO HISTOPATOLÓGICO" val={d.patologia} renglones={2} />

        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: AZUL, marginTop: 4 }}>9.- EQUIPO QUIRÚRGICO</Text>
        <Tabla>
          <Fila>
            <Th w={1}>CIRUJANO</Th>
            <Td w={2}>{d.equipo.cirujano ?? d.medico.nombre}</Td>
            <Th w={1}>CIRCULANTE</Th>
            <Td w={2}>{d.equipo.circulante ?? ""}</Td>
          </Fila>
          <Fila>
            <Th w={1}>ANESTESIÓLOGO</Th>
            <Td w={2}>{d.equipo.anestesiologo ?? ""}</Td>
            <Th w={1}>1er. AYUDANTE</Th>
            <Td w={2}>{d.equipo.primerAyudante ?? ""}</Td>
          </Fila>
          <Fila>
            <Th w={1}>INSTRUMENTISTA</Th>
            <Td w={2}>{d.equipo.instrumentista ?? ""}</Td>
            <Th w={1}>2o. AYUDANTE</Th>
            <Td w={2}>{d.equipo.segundoAyudante ?? ""}</Td>
          </Fila>
        </Tabla>

        <View style={[f.firmas, { marginTop: 20, justifyContent: "flex-end" }]}>
          <FirmaMedico medico={d.medico} etiqueta="FIRMA DEL CIRUJANO" />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}
