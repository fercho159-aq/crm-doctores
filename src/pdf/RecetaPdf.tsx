import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

export type RecetaPdfData = {
  folio: string;
  fechaEmision: string;
  establecimiento: { razonSocial: string; domicilio: string; telefono: string; logotipo?: string | null };
  medico: {
    nombre: string;
    especialidad: string;
    cedulaProfesional: string;
    cedulaEspecialidad?: string | null;
    institucionTitulo: string;
    universidadEspecialidad?: string | null;
    firmaDigitalizada?: string | null;
  };
  paciente: { nombre: string; edad: string; sexo: string; expediente: string; peso?: string | null };
  diagnostico?: string | null;
  partidas: {
    medicamento: string;
    presentacion?: string | null;
    dosis: string;
    viaAdministracion: string;
    frecuencia: string;
    duracion: string;
    cantidad?: string | null;
    indicaciones?: string | null;
  }[];
  indicacionesGenerales?: string | null;
  proximaCita?: string | null;
  hashDocumento?: string;
};

const s = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#1a2333" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: "#1e5aa8", paddingBottom: 10, marginBottom: 10 },
  h1: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1e5aa8" },
  small: { fontSize: 8, color: "#555" },
  label: { fontSize: 8, color: "#666", fontFamily: "Helvetica-Bold" },
  row: { flexDirection: "row", marginBottom: 2 },
  box: { borderWidth: 1, borderColor: "#c9d4e3", borderRadius: 4, padding: 8, marginBottom: 10 },
  medRow: { borderBottomWidth: 1, borderBottomColor: "#e4e9f1", paddingVertical: 6 },
  medName: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  footer: { position: "absolute", bottom: 30, left: 36, right: 36 },
  firma: { alignItems: "center", marginTop: 24 },
  firmaLinea: { borderTopWidth: 1, borderTopColor: "#1a2333", width: 200, paddingTop: 4, alignItems: "center" },
  aviso: { fontSize: 7, color: "#777", marginTop: 8, textAlign: "center" },
});

export function RecetaPdf({ data }: { data: RecetaPdfData }) {
  return (
    <Document title={`Receta ${data.folio}`}>
      <Page size="LETTER" style={s.page}>
        {/* Encabezado: establecimiento + médico (RIS arts. 28–31) */}
        <View style={s.header}>
          <View style={{ maxWidth: 300 }}>
            {data.establecimiento.logotipo ? (
              <Image src={data.establecimiento.logotipo} style={{ width: 90, marginBottom: 4 }} />
            ) : null}
            <Text style={s.h1}>{data.establecimiento.razonSocial}</Text>
            <Text style={s.small}>{data.establecimiento.domicilio}</Text>
            <Text style={s.small}>Tel: {data.establecimiento.telefono}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.medico.nombre}</Text>
            <Text style={s.small}>{data.medico.especialidad}</Text>
            <Text style={s.small}>Céd. Prof. {data.medico.cedulaProfesional} — {data.medico.institucionTitulo}</Text>
            {data.medico.cedulaEspecialidad ? (
              <Text style={s.small}>
                Céd. Esp. {data.medico.cedulaEspecialidad}
                {data.medico.universidadEspecialidad ? ` — ${data.medico.universidadEspecialidad}` : ""}
              </Text>
            ) : null}
            <Text style={{ marginTop: 6, fontFamily: "Helvetica-Bold", color: "#1e5aa8" }}>Folio: {data.folio}</Text>
            <Text style={s.small}>{data.fechaEmision}</Text>
          </View>
        </View>

        {/* Paciente */}
        <View style={s.box}>
          <View style={s.row}>
            <Text style={s.label}>PACIENTE: </Text>
            <Text>{data.paciente.nombre}</Text>
          </View>
          <View style={s.row}>
            <Text style={s.label}>EDAD: </Text>
            <Text>{data.paciente.edad}   </Text>
            <Text style={s.label}>SEXO: </Text>
            <Text>{data.paciente.sexo}   </Text>
            <Text style={s.label}>EXPEDIENTE: </Text>
            <Text>{data.paciente.expediente}</Text>
            {data.paciente.peso ? (
              <>
                <Text style={s.label}>   PESO: </Text>
                <Text>{data.paciente.peso} kg</Text>
              </>
            ) : null}
          </View>
          {data.diagnostico ? (
            <View style={s.row}>
              <Text style={s.label}>DIAGNÓSTICO: </Text>
              <Text>{data.diagnostico}</Text>
            </View>
          ) : null}
        </View>

        {/* Medicamentos */}
        <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 4, color: "#1e5aa8" }}>Rp/</Text>
        {data.partidas.map((p, i) => (
          <View key={i} style={s.medRow} wrap={false}>
            <Text style={s.medName}>
              {i + 1}. {p.medicamento}
              {p.presentacion ? ` — ${p.presentacion}` : ""}
              {p.cantidad ? `   (${p.cantidad})` : ""}
            </Text>
            <Text style={{ marginTop: 2 }}>
              Dosis: {p.dosis} · Vía: {p.viaAdministracion} · Frecuencia: {p.frecuencia} · Duración: {p.duracion}
            </Text>
            {p.indicaciones ? <Text style={{ color: "#444", marginTop: 1 }}>Indicaciones: {p.indicaciones}</Text> : null}
          </View>
        ))}

        {data.indicacionesGenerales ? (
          <View style={{ marginTop: 10 }}>
            <Text style={s.label}>INDICACIONES GENERALES</Text>
            <Text>{data.indicacionesGenerales}</Text>
          </View>
        ) : null}
        {data.proximaCita ? (
          <View style={{ marginTop: 6 }}>
            <Text style={s.label}>PRÓXIMA CITA</Text>
            <Text>{data.proximaCita}</Text>
          </View>
        ) : null}

        {/* Firma */}
        <View style={s.firma}>
          {data.medico.firmaDigitalizada ? (
            <Image src={data.medico.firmaDigitalizada} style={{ width: 140, height: 50, objectFit: "contain" }} />
          ) : (
            <View style={{ height: 40 }} />
          )}
          <View style={s.firmaLinea}>
            <Text style={{ fontSize: 9 }}>{data.medico.nombre}</Text>
            <Text style={s.small}>Cédula profesional {data.medico.cedulaProfesional}</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.aviso}>
            Documento generado electrónicamente. Folio {data.folio} · {data.fechaEmision}
            {data.hashDocumento ? ` · SHA-256 ${data.hashDocumento.slice(0, 16)}…` : ""}
          </Text>
          <Text style={s.aviso}>
            Este sistema no emite recetas de medicamentos controlados (fracciones I–III del art. 226 LGS).
            Los antibióticos (fracción IV) serán retenidos o sellados por la farmacia conforme a la normativa vigente.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
