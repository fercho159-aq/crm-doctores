import React from "react";
import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
  Encabezado,
  PieLegal,
  Tabla,
  Fila,
  Th,
  Td,
  LineaLlenado,
  f,
  type Establecimiento,
  type PacientePdf,
} from "./formatos";
import { MATERIALES_BLOQUE_2 } from "@/lib/catalogoInsumos";

// Hojas oficiales 11-14: control e inventario de insumos cobrables.
// Enfermería registra la cantidad («PZ.») y administración captura el precio
// («$») para cerrar la cuenta del paciente.

export type RenglonConsumo = {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
  fecha?: string | null;
  enfermera?: string | null;
  observaciones?: string | null;
};

const money = (n: number) =>
  n === 0 ? "" : n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cantidad = (n: number) => (n === 0 ? "" : String(Number(n)));

/**
 * Bloque «MATERIALES / PZ. / $» del formato impreso: los renglones del catálogo
 * en su orden original, con subtotal al pie. Los renglones sin consumo se
 * imprimen igual, en blanco, para que la hoja siga sirviendo como checklist.
 */
const FUENTE = 5.4;
const ALTO_FILA = 8.4;

function BloqueInsumos({
  titulo,
  renglones,
  minimo = 0,
}: {
  titulo: string;
  renglones: RenglonConsumo[];
  minimo?: number;
}) {
  const subtotal = renglones.reduce((s, r) => s + r.importe, 0);
  const vacias = Math.max(0, minimo - renglones.length);
  const celda = { alto: ALTO_FILA, fuente: FUENTE, denso: true };
  return (
    <Tabla style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, marginRight: 4 }}>
      <Fila>
        <Th w={4} {...celda}>{titulo}</Th>
        <Th w={0.9} {...celda}>PZ.</Th>
        <Th w={1.3} {...celda}>$</Th>
      </Fila>
      {renglones.map((r, i) => (
        <Fila key={i}>
          <Td w={4} {...celda}>{r.descripcion}</Td>
          <Td w={0.9} {...celda} align="center">{cantidad(r.cantidad)}</Td>
          <Td w={1.3} {...celda} align="right">{money(r.importe)}</Td>
        </Fila>
      ))}
      {Array.from({ length: vacias }, (_, i) => (
        <Fila key={`v${i}`}>
          <Td w={4} {...celda} />
          <Td w={0.9} {...celda} />
          <Td w={1.3} {...celda} />
        </Fila>
      ))}
      <Fila>
        <Th w={4} {...celda} align="center">SUBTOTAL</Th>
        <Th w={0.9} {...celda} />
        <Th w={1.3} {...celda} align="right">{`$ ${money(subtotal) || "0.00"}`}</Th>
      </Fila>
    </Tabla>
  );
}

export type ConsumoQuirofanoData = {
  est: Establecimiento;
  paciente: PacientePdf;
  materiales: RenglonConsumo[];
  medicamentos: RenglonConsumo[];
  suturas: RenglonConsumo[];
  soluciones: RenglonConsumo[];
  otros: RenglonConsumo[];
  servicios: RenglonConsumo[];
  equipo: {
    medicoPediatra?: string | null;
    medicoTratante?: string | null;
    medicoCirujano?: string | null;
    medicoAnestesiologo?: string | null;
    medicoAyudante?: string | null;
    enfermera?: string | null;
    instrumentista?: string | null;
  };
  datos: {
    procedimiento?: string | null;
    fechaIngreso?: string | null;
    fechaEgreso?: string | null;
    horaIngresoQuirofano?: string | null;
    horaTerminoQuirofano?: string | null;
    turno?: string | null;
  };
  fecha: string;
  hash?: string;
};

export function ConsumoQuirofanoPdf({ d }: { d: ConsumoQuirofanoData }) {
  const totalServicios = d.servicios.reduce((s, r) => s + r.importe, 0);
  // El formato reparte los materiales en dos recuadros, uno por página.
  const enBloque2 = new Set<string>(MATERIALES_BLOQUE_2);
  const materialesA = d.materiales.filter((r) => !enBloque2.has(r.descripcion));
  const materialesB = d.materiales.filter((r) => enBloque2.has(r.descripcion));

  return (
    <Document title={`Hoja de consumo en quirófano ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.pageDensa}>
        <Encabezado est={d.est} titulo="HOJA DE CONSUMO EN QUIRÓFANO" />
        <View style={f.fila}>
          <LineaLlenado et="PACIENTE" val={d.paciente.nombre} w="60%" />
          <LineaLlenado et="EXPEDIENTE" val={d.paciente.expediente} w="40%" />
        </View>
        <View style={{ flexDirection: "row", marginTop: 4 }}>
          <BloqueInsumos titulo="MATERIALES" renglones={materialesA} />
          <BloqueInsumos titulo="MEDICAMENTOS" renglones={d.medicamentos} />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>

      <Page size="LETTER" style={f.pageDensa}>
        <View style={{ flexDirection: "row" }}>
          <BloqueInsumos titulo="MATERIALES" renglones={materialesB} />
          <BloqueInsumos titulo="SUTURAS" renglones={d.suturas} />
        </View>
        <View style={{ flexDirection: "row", marginTop: 4 }}>
          <BloqueInsumos titulo="SOLUCIONES" renglones={d.soluciones} />
          <BloqueInsumos titulo="OTROS" renglones={d.otros} minimo={6} />
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 6 }}>
          <View style={{ width: "60%" }}>
            <Tabla>
              <Fila>
                <Th w={3}>SERVICIOS</Th>
                <Th w={1.2}>$</Th>
              </Fila>
              {d.servicios.map((r, i) => (
                <Fila key={i}>
                  <Td w={3} alto={11}>{r.descripcion}</Td>
                  <Td w={1.2} alto={11} align="right">{money(r.importe)}</Td>
                </Fila>
              ))}
              <Fila>
                <Th w={3} align="center">TOTAL GENERAL DE SERVICIOS</Th>
                <Th w={1.2} align="right">{`$ ${money(totalServicios) || "0.00"}`}</Th>
              </Fila>
            </Tabla>
          </View>
        </View>

        <View style={{ flexDirection: "row", marginTop: 10 }}>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, paddingRight: 10 }}>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1e5aa8", marginBottom: 4 }}>
              EQUIPO MÉDICO
            </Text>
            <LineaLlenado et="MÉDICO PEDIATRA" val={d.equipo.medicoPediatra} />
            <LineaLlenado et="MÉDICO TRATANTE" val={d.equipo.medicoTratante} />
            <LineaLlenado et="MÉDICO CIRUJANO" val={d.equipo.medicoCirujano} />
            <LineaLlenado et="MÉDICO ANESTESIÓLOGO" val={d.equipo.medicoAnestesiologo} />
            <LineaLlenado et="MÉDICO AYUDANTE" val={d.equipo.medicoAyudante} />
            <LineaLlenado et="ENFERMERA" val={d.equipo.enfermera} />
            <LineaLlenado et="INSTRUMENTISTA" val={d.equipo.instrumentista} />
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1e5aa8", marginBottom: 4 }}>
              DATOS DEL PACIENTE
            </Text>
            <LineaLlenado et="NOMBRE DEL PACIENTE" val={d.paciente.nombre} />
            <LineaLlenado et="PROCEDIMIENTO" val={d.datos.procedimiento} />
            <LineaLlenado et="FECHA DE INGRESO" val={d.datos.fechaIngreso} />
            <LineaLlenado et="FECHA DE EGRESO" val={d.datos.fechaEgreso} />
            <LineaLlenado et="HORA DE INGRESO QUIRÓFANO" val={d.datos.horaIngresoQuirofano} />
            <LineaLlenado et="HORA DE TÉRMINO DE QUIRÓFANO" val={d.datos.horaTerminoQuirofano} />
            <LineaLlenado et="TURNO" val={d.datos.turno} />
          </View>
        </View>

        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ─────────────── Hoja de consumo de piso (hojas oficiales 13-14) ───────────────

export type ConsumoPisoData = {
  est: Establecimiento;
  paciente: PacientePdf;
  tratamiento?: string | null;
  cuarto?: string | null;
  renglones: RenglonConsumo[];
  fecha: string;
  hash?: string;
};

const RENGLONES_PISO = 30;

export function ConsumoPisoPdf({ d }: { d: ConsumoPisoData }) {
  const vacias = Math.max(0, RENGLONES_PISO - d.renglones.length);
  const total = d.renglones.reduce((s, r) => s + r.importe, 0);
  return (
    <Document title={`Hoja de consumo de piso ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.pageDensa}>
        <Encabezado est={d.est} titulo="HOJA DE CONSUMO DE PISO" />

        <Tabla>
          <Fila>
            <Th w={1}>PACIENTE</Th>
            <Td w={3.2}>{d.paciente.nombre}</Td>
            <Th w={1.1}>CUARTO NÚMERO</Th>
            <Td w={0.9} align="center">{d.cuarto ?? ""}</Td>
          </Fila>
          <Fila>
            <Th w={1}>TRATAMIENTO</Th>
            <Td w={3.2}>{d.tratamiento ?? ""}</Td>
            <Th w={1.1}>EXPEDIENTE</Th>
            <Td w={0.9} align="center">{d.paciente.expediente}</Td>
          </Fila>
        </Tabla>

        <Tabla>
          <Fila>
            <Th w={1.1}>FECHA</Th>
            <Th w={1.6}>ENFERMERA</Th>
            <Th w={3.2}>MEDICAMENTO O MATERIAL</Th>
            <Th w={1}>CANTIDAD</Th>
            <Th w={1}>PRECIO</Th>
            <Th w={2.2}>OBSERVACIONES</Th>
          </Fila>
          {d.renglones.map((r, i) => (
            <Fila key={i}>
              <Td w={1.1} alto={12} align="center">{r.fecha ?? ""}</Td>
              <Td w={1.6} alto={12}>{r.enfermera ?? ""}</Td>
              <Td w={3.2} alto={12}>{r.descripcion}</Td>
              <Td w={1} alto={12} align="center">{cantidad(r.cantidad)}</Td>
              <Td w={1} alto={12} align="right">{money(r.importe)}</Td>
              <Td w={2.2} alto={12}>{r.observaciones ?? ""}</Td>
            </Fila>
          ))}
          {Array.from({ length: vacias }, (_, i) => (
            <Fila key={`v${i}`}>
              <Td w={1.1} alto={12} />
              <Td w={1.6} alto={12} />
              <Td w={3.2} alto={12} />
              <Td w={1} alto={12} />
              <Td w={1} alto={12} />
              <Td w={2.2} alto={12} />
            </Fila>
          ))}
          <Fila>
            <Th w={6.9} align="right">TOTAL</Th>
            <Th w={1} align="right">{`$ ${money(total) || "0.00"}`}</Th>
            <Th w={2.2} />
          </Fila>
        </Tabla>

        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}
