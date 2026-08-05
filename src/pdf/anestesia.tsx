import React from "react";
import { Document, Page, Text, View, Svg, Line, Polyline, Circle, Path } from "@react-pdf/renderer";
import {
  Encabezado,
  PieLegal,
  Tabla,
  Fila,
  Th,
  Td,
  TdVista,
  Casilla,
  GrupoCasillas,
  LineaLlenado,
  Renglones,
  BloqueTexto,
  FirmaEnBlanco,
  f,
  type Establecimiento,
  type PacientePdf,
  type Estilo,
} from "./formatos";
import {
  ASA,
  ANGINA_CANADIENSE,
  GOLDMAN,
  GOLDMAN_CLASES,
  PREDICTORES_EAC,
  TROMBOLITICO,
  GLASGOW,
  PUPILAS,
  VENTILACION_DIFICIL,
  MALLAMPATI,
  APERTURA_BUCAL,
  DISTANCIA_TIROMENTONIANA,
  SUBLUXACION_MANDIBULAR,
  EXTENSION_CABEZA,
  FACTORES_RIESGO,
  TIPO_CIRUGIA,
  TIPO_PAGO,
  EXPLORACION_SEGMENTOS,
  PLAN_ANESTESICO,
  VERIFICACION_EQUIPO,
  VERIFICACION_OPCIONALES,
  POSICION_PACIENTE,
  POSICION_BRAZOS,
  TECNICA_ANESTESICA,
  TIEMPOS_TRANSANESTESICOS,
  EGRESOS,
  INGRESOS,
  DESTINO_SALA,
  ALDRETE_TIEMPOS,
  ALDRETE_CRITERIOS,
  RAMSAY,
  BROMAGE,
  DESTINO_RECUPERACION,
  PLAN_POSTANESTESICO,
  sumarPuntos,
  clasificarGoldman,
  clasificarTrombolitico,
} from "@/lib/escalasAnestesia";

// Hojas oficiales 15-20: formatos exclusivos del servicio de anestesiología.

export type AnestesiologoPdf = { nombre: string; cedula?: string | null; firma?: string | null };

const chico = { fuente: 6.2, denso: true, alto: 10 };

// ═══════════════ Hojas 15-16: VALORACIÓN PREANESTÉSICA ═══════════════

export type ValoracionPreanestesicaData = {
  est: Establecimiento;
  paciente: PacientePdf;
  anestesiologo: AnestesiologoPdf;
  v: {
    habitacion?: string | null;
    servicio?: string | null;
    folio?: string | null;
    tipoPago?: string | null;
    fechaIngreso?: string | null;
    horaIngreso?: string | null;
    diagnosticoPrequirurgico?: string | null;
    cirugiaPlaneada?: string | null;
    cirujano?: string | null;
    anestesiologo?: string | null;
    tipoCirugia?: string[] | null;
    antecedentesImportancia?: string | null;
    pesoKg?: string | null;
    tallaCm?: string | null;
    imc?: string | null;
    temperatura?: string | null;
    ta?: string | null;
    fr?: string | null;
    fc?: string | null;
    spo2?: string | null;
    exploracion?: Record<string, string | null> | null;
    labFecha?: string | null;
    grupoSanguineo?: string | null;
    factorRh?: string | null;
    laboratorio?: Record<string, string | null> | null;
    labOtros?: string | null;
    ecg?: string | null;
    rayosX?: string | null;
    ultrasonido?: string | null;
    gabineteOtros?: string | null;
    factoresRiesgo?: { marcadas?: string[]; especificar?: string | null } | null;
    asa?: string | null;
    anginaCanadiense?: string | null;
    goldman?: string[] | null;
    predictores?: { menores?: string[]; intermedios?: string[]; mayores?: string[] } | null;
    trombolitico?: { menores?: string[]; intermedios?: string[]; mayores?: string[] } | null;
    neurologico?: { pupilas?: string[]; ojos?: number; motor?: number; verbal?: number } | null;
    viaAerea?: {
      ventilacionDificil?: string[];
      mallampati?: string | null;
      apertura?: string | null;
      tiromentoniana?: string | null;
      subluxacion?: string | null;
      extension?: string | null;
    } | null;
    planAnestesico?: string[] | null;
    fechaElaboracion?: string | null;
  };
  fecha: string;
  hash?: string;
};

/** Recuadro con título de la hoja de factores de riesgo. */
function Recuadro({ titulo, children, style }: { titulo: string; children: React.ReactNode; style?: Estilo }) {
  return (
    <View style={[{ borderWidth: 0.7, borderColor: "#1e5aa8", marginBottom: 4 }, style ?? {}]}>
      <Text
        style={{
          backgroundColor: "#dbe8f7",
          fontFamily: "Helvetica-Bold",
          fontSize: 6.8,
          color: "#1e5aa8",
          textAlign: "center",
          paddingVertical: 2,
        }}
      >
        {titulo}
      </Text>
      <View style={{ padding: 3 }}>{children}</View>
    </View>
  );
}

function ListaCasillas({ opciones, marcadas }: { opciones: string[]; marcadas?: string[] | null }) {
  const sel = marcadas ?? [];
  return (
    <View>
      {opciones.map((o) => (
        <Casilla key={o} label={o} marcada={sel.includes(o)} />
      ))}
    </View>
  );
}

function BloquePuntos({
  titulo,
  opciones,
  marcadas,
}: {
  titulo: string;
  opciones: { clave: string; texto: string; puntos: number }[];
  marcadas?: string[] | null;
}) {
  const sel = marcadas ?? [];
  return (
    <Tabla style={{ marginBottom: 3 }}>
      <Fila>
        <Th w={5} {...chico} align="left">{titulo}</Th>
        <Th w={1} {...chico}>Valor</Th>
      </Fila>
      {opciones.map((o) => (
        <Fila key={o.clave}>
          <TdVista w={5} alto={10} style={{ paddingVertical: 0.8, paddingHorizontal: 2 }}>
            <Casilla label={o.texto} marcada={sel.includes(o.clave)} />
          </TdVista>
          <Td w={1} {...chico} align="center">{String(o.puntos)}</Td>
        </Fila>
      ))}
      <Fila>
        <Th w={5} {...chico} align="right">Subtotal</Th>
        <Th w={1} {...chico} align="center">{String(sumarPuntos(opciones, sel))}</Th>
      </Fila>
    </Tabla>
  );
}

export function ValoracionPreanestesicaPdf({ d }: { d: ValoracionPreanestesicaData }) {
  const { v } = d;
  const goldmanPuntos = sumarPuntos(GOLDMAN, v.goldman);
  const trombTotal =
    sumarPuntos(TROMBOLITICO.menores, v.trombolitico?.menores) +
    sumarPuntos(TROMBOLITICO.intermedios, v.trombolitico?.intermedios) +
    sumarPuntos(TROMBOLITICO.mayores, v.trombolitico?.mayores);
  const glasgow = (v.neurologico?.ojos ?? 0) + (v.neurologico?.motor ?? 0) + (v.neurologico?.verbal ?? 0);

  return (
    <Document title={`Valoración preanestésica ${d.paciente.expediente}`}>
      {/* ── Hoja 15: datos, exploración, laboratorio y gabinete ── */}
      <Page size="LETTER" style={f.pageDensa}>
        <Encabezado est={d.est} titulo="VALORACIÓN PREANESTÉSICA" />

        <View style={f.fila}>
          <LineaLlenado et="NOMBRE DEL PACIENTE" val={d.paciente.nombre} w="70%" />
          <LineaLlenado et="EXPEDIENTE" val={d.paciente.expediente} w="30%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="FECHA DE NACIMIENTO" val={d.paciente.fechaNacimiento} w="40%" />
          <LineaLlenado et="EDAD" val={d.paciente.edad} w="25%" />
          <LineaLlenado et="SEXO" val={d.paciente.sexo} w="35%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="HABITACIÓN" val={v.habitacion} w="30%" />
          <LineaLlenado et="SERVICIO" val={v.servicio} w="40%" />
          <LineaLlenado et="FOLIO" val={v.folio} w="30%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="FECHA INGRESO" val={v.fechaIngreso} w="35%" />
          <LineaLlenado et="HORA INGRESO" val={v.horaIngreso} w="25%" />
          <View style={{ width: "40%", justifyContent: "flex-end" }}>
            <GrupoCasillas opciones={TIPO_PAGO} seleccion={v.tipoPago} />
          </View>
        </View>

        <View style={f.fila}>
          <LineaLlenado et="DIAGNÓSTICO PREQUIRÚRGICO" val={v.diagnosticoPrequirurgico} w="55%" />
          <LineaLlenado et="CIRUGÍA PLANEADA" val={v.cirugiaPlaneada} w="45%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="CIRUJANO" val={v.cirujano} w="50%" />
          <LineaLlenado et="ANESTESIÓLOGO" val={v.anestesiologo ?? d.anestesiologo.nombre} w="50%" />
        </View>
        <GrupoCasillas et="Tipo de cirugía:" opciones={TIPO_CIRUGIA} seleccion={v.tipoCirugia} />

        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e5aa8", marginTop: 3 }}>
          ANTECEDENTES DE IMPORTANCIA PARA EL PROCEDIMIENTO QUIRÚRGICO
        </Text>
        <BloqueTexto val={v.antecedentesImportancia} renglones={5} />

        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e5aa8", marginTop: 3 }}>
          EXPLORACIÓN FÍSICA
        </Text>
        <View style={f.fila}>
          <LineaLlenado et="PESO" val={v.pesoKg} w="33%" />
          <LineaLlenado et="TALLA" val={v.tallaCm} w="33%" />
          <LineaLlenado et="ÍNDICE DE MASA CORPORAL" val={v.imc} w="34%" />
        </View>

        <Tabla>
          <Fila>
            <Th>Temperatura</Th>
            <Th>Tensión Arterial</Th>
            <Th>Frecuencia Respiratoria</Th>
            <Th>Frecuencia Cardíaca</Th>
            <Th>Saturación de O2</Th>
          </Fila>
          <Fila>
            <Td align="center" alto={14}>{v.temperatura}</Td>
            <Td align="center" alto={14}>{v.ta}</Td>
            <Td align="center" alto={14}>{v.fr}</Td>
            <Td align="center" alto={14}>{v.fc}</Td>
            <Td align="center" alto={14}>{v.spo2}</Td>
          </Fila>
        </Tabla>

        <Tabla>
          {EXPLORACION_SEGMENTOS.map((s) => (
            <Fila key={s.campo}>
              <Th w={1} align="left">{s.etiqueta}</Th>
              <Td w={5} alto={13}>{v.exploracion?.[s.campo] ?? ""}</Td>
            </Fila>
          ))}
        </Tabla>

        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e5aa8", marginTop: 3 }}>
          RESULTADO DE EXÁMENES DE LABORATORIO
        </Text>
        <View style={f.fila}>
          <LineaLlenado et="FECHA DE REALIZACIÓN" val={v.labFecha} w="40%" />
          <LineaLlenado et="GRUPO SANGUÍNEO" val={v.grupoSanguineo} w="30%" />
          <LineaLlenado et="FACTOR RH" val={v.factorRh} w="30%" />
        </View>

        <Tabla>
          <Fila>
            <Th {...chico}>Hemoglobina</Th>
            <Th {...chico}>Hematocrito</Th>
            <Th {...chico}>Plaquetas</Th>
            <Th {...chico}>Leucocitos</Th>
            <Th {...chico}>T. Protrombina</Th>
            <Th {...chico}>T. P. Tromboplastina</Th>
            <Th {...chico}>T. Trombina</Th>
          </Fila>
          <Fila>
            <Td align="center" alto={13}>{v.laboratorio?.hemoglobina ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.hematocrito ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.plaquetas ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.leucocitos ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.tp ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.tpt ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.tt ?? ""}</Td>
          </Fila>
          <Fila>
            <Th {...chico}>Glucosa</Th>
            <Th {...chico}>Creatinina</Th>
            <Th {...chico}>Urea</Th>
            <Th {...chico}>Sodio</Th>
            <Th {...chico}>Potasio</Th>
            <Th {...chico}>Cloro</Th>
            <Th {...chico}>Calcio</Th>
          </Fila>
          <Fila>
            <Td align="center" alto={13}>{v.laboratorio?.glucosa ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.creatinina ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.urea ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.sodio ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.potasio ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.cloro ?? ""}</Td>
            <Td align="center" alto={13}>{v.laboratorio?.calcio ?? ""}</Td>
          </Fila>
        </Tabla>
        <LineaLlenado et="OTROS / ESPECIFICAR" val={v.labOtros} />

        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e5aa8", marginTop: 3 }}>
          RESULTADOS DE ESTUDIOS DE GABINETE
        </Text>
        <LineaLlenado et="ELECTROCARDIOGRAMA" val={v.ecg} />
        <LineaLlenado et="RAYOS X" val={v.rayosX} />
        <LineaLlenado et="ULTRASONIDO" val={v.ultrasonido} />
        <LineaLlenado et="OTROS (ESPECIFICAR)" val={v.gabineteOtros} />

        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>

      {/* ── Hoja 16: valoración de factores de riesgo ── */}
      <Page size="LETTER" style={f.pageDensa}>
        <Text style={f.titulo}>VALORACIÓN PRE-ANESTÉSICA — VALORACIÓN DE FACTORES DE RIESGO</Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {FACTORES_RIESGO.map((x) => (
            <Casilla key={x} label={x} marcada={v.factoresRiesgo?.marcadas?.includes(x)} ancho="32%" />
          ))}
        </View>
        <LineaLlenado et="ESPECIFICAR" val={v.factoresRiesgo?.especificar} />

        <View style={{ flexDirection: "row", marginTop: 4 }}>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, marginRight: 4 }}>
            <Recuadro titulo="CLASIFICACIÓN DE ASA">
              {ASA.map((a) => (
                <View key={a.clave} style={{ flexDirection: "row", marginBottom: 1.5 }}>
                  <Casilla marcada={v.asa === a.clave} />
                  <Text style={{ fontSize: 6.2, flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>{a.clave}.- </Text>
                    {a.texto}
                  </Text>
                </View>
              ))}
            </Recuadro>

            <Recuadro titulo="CLASIFICACIÓN DE ANGINA POR LA SOCIEDAD CARDIOVASCULAR CANADIENSE">
              {ANGINA_CANADIENSE.map((a) => (
                <View key={a.clave} style={{ flexDirection: "row", marginBottom: 1.5 }}>
                  <Casilla marcada={v.anginaCanadiense === a.clave} />
                  <Text style={{ fontSize: 6.2, flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>{a.clave}: </Text>
                    {a.texto}
                  </Text>
                </View>
              ))}
            </Recuadro>
          </View>

          <View style={{ flexGrow: 0.75, flexShrink: 1, flexBasis: 0 }}>
            <Tabla>
              <Fila>
                <Th w={3} {...chico}>Clasificación de Goldman — Variable</Th>
                <Th w={1} {...chico}>Puntos</Th>
              </Fila>
              {GOLDMAN.map((g) => (
                <Fila key={g.clave}>
                  <TdVista w={3} alto={10} style={{ paddingVertical: 0.8, paddingHorizontal: 2 }}>
                    <Casilla label={g.texto} marcada={v.goldman?.includes(g.clave)} />
                  </TdVista>
                  <Td w={1} {...chico} align="center">{String(g.puntos)}</Td>
                </Fila>
              ))}
              <Fila>
                <Th w={3} {...chico} align="right">TOTAL DE PUNTOS</Th>
                <Th w={1} {...chico} align="center">{String(goldmanPuntos)}</Th>
              </Fila>
              {GOLDMAN_CLASES.map((c) => (
                <Fila key={c.clase}>
                  <TdVista w={3} alto={10} style={{ paddingVertical: 0.8, paddingHorizontal: 2 }}>
                    <Casilla label={c.clase} marcada={clasificarGoldman(goldmanPuntos) === c.clase} />
                  </TdVista>
                  <Td w={1} {...chico} align="center">{c.rango}</Td>
                </Fila>
              ))}
            </Tabla>
          </View>
        </View>

        <View style={{ flexDirection: "row" }}>
          <View style={{ flexGrow: 1.1, flexShrink: 1, flexBasis: 0, marginRight: 4 }}>
            <Recuadro titulo="PREDICTORES DE ENFERMEDAD ARTERIAL CORONARIA">
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold", marginBottom: 1 }}>
                PREDICTORES MENORES
              </Text>
              <ListaCasillas opciones={PREDICTORES_EAC.menores} marcadas={v.predictores?.menores} />
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold", marginTop: 2, marginBottom: 1 }}>
                PREDICTORES INTERMEDIOS
              </Text>
              <ListaCasillas opciones={PREDICTORES_EAC.intermedios} marcadas={v.predictores?.intermedios} />
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold", marginTop: 2, marginBottom: 1 }}>
                PREDICTORES MAYORES
              </Text>
              <ListaCasillas opciones={PREDICTORES_EAC.mayores} marcadas={v.predictores?.mayores} />
            </Recuadro>
          </View>

          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, marginRight: 4 }}>
            <Text
              style={{
                backgroundColor: "#dbe8f7",
                borderWidth: 0.7,
                borderColor: "#1e5aa8",
                fontFamily: "Helvetica-Bold",
                fontSize: 6.8,
                color: "#1e5aa8",
                textAlign: "center",
                paddingVertical: 2,
                marginBottom: 3,
              }}
            >
              VALORACIÓN DE RIESGO TROMBOLÍTICO
            </Text>
            <BloquePuntos titulo="Factores menores" opciones={TROMBOLITICO.menores} marcadas={v.trombolitico?.menores} />
            <BloquePuntos
              titulo="Factores intermedios"
              opciones={TROMBOLITICO.intermedios}
              marcadas={v.trombolitico?.intermedios}
            />
            <BloquePuntos titulo="Factores mayores" opciones={TROMBOLITICO.mayores} marcadas={v.trombolitico?.mayores} />
            <Tabla>
              <Fila>
                <Th w={3} {...chico} align="left">RIESGO TOTAL</Th>
                <Th w={1} {...chico} align="center">{String(trombTotal)}</Th>
              </Fila>
              <Fila>
                <Td w={4} {...chico}>{clasificarTrombolitico(trombTotal)}</Td>
              </Fila>
            </Tabla>
          </View>

          <View style={{ flexGrow: 0.85, flexShrink: 1, flexBasis: 0 }}>
            <Recuadro titulo="VALORACIÓN NEUROLÓGICA">
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold" }}>Pupilas</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {PUPILAS.map((x) => (
                  <Casilla key={x} label={x} marcada={v.neurologico?.pupilas?.includes(x)} ancho="48%" />
                ))}
              </View>
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold", marginTop: 2 }}>Escala de Glasgow</Text>
              <Tabla>
                <Fila>
                  <Th w={1} {...chico}>Ojos</Th>
                  <Td w={1.6} {...chico} align="center">{v.neurologico?.ojos ?? ""}</Td>
                </Fila>
                <Fila>
                  <Th w={1} {...chico}>Motor</Th>
                  <Td w={1.6} {...chico} align="center">{v.neurologico?.motor ?? ""}</Td>
                </Fila>
                <Fila>
                  <Th w={1} {...chico}>Verbal</Th>
                  <Td w={1.6} {...chico} align="center">{v.neurologico?.verbal ?? ""}</Td>
                </Fila>
                <Fila>
                  <Th w={1} {...chico}>Total</Th>
                  <Th w={1.6} {...chico} align="center">{glasgow ? String(glasgow) : ""}</Th>
                </Fila>
              </Tabla>
              <Text style={{ fontSize: 5.6, color: "#666" }}>
                Ojos {GLASGOW.ojos.map((o) => `${o.texto} ${o.puntos}`).join(" · ")}
              </Text>
              <Text style={{ fontSize: 5.6, color: "#666" }}>
                Motor {GLASGOW.motor.map((o) => `${o.texto} ${o.puntos}`).join(" · ")}
              </Text>
              <Text style={{ fontSize: 5.6, color: "#666" }}>
                Verbal {GLASGOW.verbal.map((o) => `${o.texto} ${o.puntos}`).join(" · ")}
              </Text>
            </Recuadro>

            <Recuadro titulo="VÍA AÉREA DIFÍCIL">
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold" }}>Predicción de ventilación difícil</Text>
              <ListaCasillas opciones={VENTILACION_DIFICIL} marcadas={v.viaAerea?.ventilacionDificil} />
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold", marginTop: 2 }}>Mallampati</Text>
              <GrupoCasillas opciones={MALLAMPATI} seleccion={v.viaAerea?.mallampati} />
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold", marginTop: 2 }}>Apertura bucal</Text>
              <ListaCasillas opciones={APERTURA_BUCAL} marcadas={v.viaAerea?.apertura ? [v.viaAerea.apertura] : []} />
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold", marginTop: 2 }}>
                Distancia tiromentoniana
              </Text>
              <ListaCasillas
                opciones={DISTANCIA_TIROMENTONIANA}
                marcadas={v.viaAerea?.tiromentoniana ? [v.viaAerea.tiromentoniana] : []}
              />
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold", marginTop: 2 }}>Subluxación mandibular</Text>
              <ListaCasillas
                opciones={SUBLUXACION_MANDIBULAR}
                marcadas={v.viaAerea?.subluxacion ? [v.viaAerea.subluxacion] : []}
              />
              <Text style={{ fontSize: 6.2, fontFamily: "Helvetica-Bold", marginTop: 2 }}>Extensión de la cabeza</Text>
              <GrupoCasillas opciones={EXTENSION_CABEZA} seleccion={v.viaAerea?.extension} />
            </Recuadro>
          </View>
        </View>

        <GrupoCasillas et="Plan anestésico:" opciones={PLAN_ANESTESICO} seleccion={v.planAnestesico} />
        <View style={f.fila}>
          <LineaLlenado et="FECHA DE ELABORACIÓN" val={v.fechaElaboracion ?? d.fecha} w="60%" />
          <LineaLlenado et="CÉDULA" val={d.anestesiologo.cedula} w="40%" />
        </View>
        <View style={[f.firmas, { marginTop: 4 }]} wrap={false}>
          <FirmaEnBlanco
            titulo={d.anestesiologo.nombre}
            subtitulo="Nombre y firma del médico anestesiólogo"
            firma={d.anestesiologo.firma}
            compacta
          />
        </View>

        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ═══════════════ Hojas 17-18: REGISTRO ANESTÉSICO Y TRANSANESTÉSICO ═══════════════

export type LecturaTransanestesica = {
  minuto: number;
  hora?: string | null;
  taSistolica?: number | null;
  taDiastolica?: number | null;
  fc?: number | null;
  fr?: number | null;
  temperatura?: number | null;
  spo2?: number | null;
  etco2?: string | null;
  pvcPam?: string | null;
  bis?: string | null;
  otros?: string | null;
};

export type RegistroAnestesicoData = {
  est: Establecimiento;
  paciente: PacientePdf;
  anestesiologo: AnestesiologoPdf;
  r: {
    evalFecha?: string | null;
    evalHora?: string | null;
    consentimientoAnestesia?: boolean | null;
    identificacionCorroborada?: boolean | null;
    verificacionEquipo?: string[] | null;
    signosBasales?: { ta?: string; fc?: string; fr?: string; temp?: string; spo2?: string } | null;
    medicacionPreanestesica?:
      | { medicamento: string; dosis?: string; via?: string; fecha?: string; hora?: string; efecto?: string }[]
      | null;
    evalObservaciones?: string | null;
    horasAyuno?: string | null;
    premedicacion?: boolean | null;
    premedicacionDetalle?: string | null;
    accesoVenoso?: boolean | null;
    accesoSitio?: string | null;
    calibreCateter?: string | null;
    posicionPaciente?: string | null;
    posicionBrazos?: string | null;
    proteccionOjos?: boolean | null;
    proteccionProminencias?: boolean | null;
    torniquete?: boolean | null;
    torniqueteSitio?: string | null;
    torniqueteInicia?: string | null;
    torniqueteTermina?: string | null;
    tecnicaAnestesica?: string | null;
    anestesiaLocal?: Record<string, string | null> | null;
    anestesiaRegional?: Record<string, string | null> | null;
    anestesiaGeneral?: Record<string, string | null> | null;
    casoObstetrico?: Record<string, string | null> | null;
    agentes?: string | null;
    tiempos?: Record<string, string | null> | null;
    tipoVentilacion?: string | null;
    egresos?: Record<string, string | null> | null;
    ingresos?: Record<string, string | null> | null;
    balanceHidrico?: string | null;
    aldreteFinal?: number | null;
    pasaA?: string | null;
    lecturas: LecturaTransanestesica[];
    farmacos: { nombre: string; dosis?: string | null; via?: string | null }[];
  };
  fecha: string;
  hash?: string;
};

/** Renglón «etiqueta: ____» de los bloques de anestesia local/regional/general. */
function SubBloque({ titulo, campos }: { titulo: string; campos: [string, string | null | undefined][] }) {
  return (
    <View style={{ marginBottom: 1.5 }}>
      <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#1e5aa8" }}>{titulo}</Text>
      <View style={f.fila}>
        {campos.map(([et, val]) => (
          <LineaLlenado key={et} et={et} val={val} w="50%" compacto />
        ))}
      </View>
    </View>
  );
}

// Gráfica del transanestésico: eje Y 30-240 (TA, FC, FR) y eje X en columnas de
// tiempo. Se dibuja con SVG para que la curva sea real y no una aproximación.
const GRAF = { ancho: 540, alto: 210, margenIzq: 22, margenSup: 6, yMin: 30, yMax: 240 };

function GraficaTransanestesica({ lecturas }: { lecturas: LecturaTransanestesica[] }) {
  const columnas = Math.max(lecturas.length, 24);
  const anchoUtil = GRAF.ancho - GRAF.margenIzq;
  const paso = anchoUtil / columnas;
  const escalaY = (valor: number) =>
    GRAF.margenSup + ((GRAF.yMax - valor) / (GRAF.yMax - GRAF.yMin)) * (GRAF.alto - GRAF.margenSup * 2);
  const x = (i: number) => GRAF.margenIzq + paso * (i + 0.5);

  const serie = (get: (l: LecturaTransanestesica) => number | null | undefined) =>
    lecturas
      .map((l, i) => ({ i, val: get(l) }))
      .filter((p): p is { i: number; val: number } => typeof p.val === "number");

  const puntos = (s: { i: number; val: number }[]) => s.map((p) => `${x(p.i)},${escalaY(p.val)}`).join(" ");

  const ta = serie((l) => l.taSistolica);
  const taD = serie((l) => l.taDiastolica);
  const fc = serie((l) => l.fc);
  const fr = serie((l) => l.fr);

  const marcasY = [240, 210, 180, 150, 120, 90, 60, 30];

  return (
    <Svg width={GRAF.ancho} height={GRAF.alto} viewBox={`0 0 ${GRAF.ancho} ${GRAF.alto}`}>
      {/* Cuadrícula con la escala del formato impreso al margen izquierdo */}
      {marcasY.map((m) => (
        <React.Fragment key={`h${m}`}>
          <Line
            x1={GRAF.margenIzq}
            x2={GRAF.ancho}
            y1={escalaY(m)}
            y2={escalaY(m)}
            stroke="#9db8d8"
            strokeWidth={0.4}
          />
          <Text x={2} y={escalaY(m) + 2} style={{ fontSize: 5.5, fill: "#1e5aa8" }}>
            {String(m)}
          </Text>
        </React.Fragment>
      ))}
      {Array.from({ length: columnas + 1 }, (_, i) => (
        <Line
          key={`v${i}`}
          x1={GRAF.margenIzq + paso * i}
          x2={GRAF.margenIzq + paso * i}
          y1={GRAF.margenSup}
          y2={GRAF.alto - GRAF.margenSup}
          stroke="#c9dcf2"
          strokeWidth={0.3}
        />
      ))}
      {/* Presión arterial: aspas unidas por su trazo (X del formato) */}
      {ta.length > 1 ? <Polyline points={puntos(ta)} stroke="#1e5aa8" strokeWidth={0.8} fill="none" /> : null}
      {taD.length > 1 ? <Polyline points={puntos(taD)} stroke="#1e5aa8" strokeWidth={0.8} fill="none" /> : null}
      {[...ta, ...taD].map((p, k) => (
        <Path
          key={`x${k}`}
          d={`M ${x(p.i) - 2} ${escalaY(p.val) - 2} L ${x(p.i) + 2} ${escalaY(p.val) + 2} M ${x(p.i) + 2} ${
            escalaY(p.val) - 2
          } L ${x(p.i) - 2} ${escalaY(p.val) + 2}`}
          stroke="#1e5aa8"
          strokeWidth={0.8}
        />
      ))}
      {/* Frecuencia cardiaca: círculo relleno */}
      {fc.length > 1 ? <Polyline points={puntos(fc)} stroke="#c0392b" strokeWidth={0.8} fill="none" /> : null}
      {fc.map((p, k) => (
        <Circle key={`fc${k}`} cx={x(p.i)} cy={escalaY(p.val)} r={1.6} fill="#c0392b" />
      ))}
      {/* Respiración: círculo hueco */}
      {fr.length > 1 ? <Polyline points={puntos(fr)} stroke="#2aa8a0" strokeWidth={0.8} fill="none" /> : null}
      {fr.map((p, k) => (
        <Circle key={`fr${k}`} cx={x(p.i)} cy={escalaY(p.val)} r={1.6} fill="none" stroke="#2aa8a0" strokeWidth={0.7} />
      ))}
    </Svg>
  );
}

const RENGLONES_FARMACOS = 10;

export function RegistroAnestesicoPdf({ d }: { d: RegistroAnestesicoData }) {
  const { r } = d;
  const lecturas = r.lecturas;
  const columnas = Math.max(lecturas.length, 24);
  const medicacion = r.medicacionPreanestesica ?? [];
  const farmacos = r.farmacos;

  return (
    <Document title={`Registro anestésico ${d.paciente.expediente}`}>
      {/* ── Hoja 17: plan, evaluación inmediata previa y registro anestésico ── */}
      <Page size="LETTER" style={f.pageDensa}>
        <Encabezado est={d.est} titulo="REGISTRO ANESTÉSICO" />
        <View style={f.fila}>
          <LineaLlenado et="PACIENTE" val={d.paciente.nombre} w="65%" />
          <LineaLlenado et="EXPEDIENTE" val={d.paciente.expediente} w="35%" />
        </View>

        <Text style={f.seccion}>EVALUACIÓN INMEDIATAMENTE ANTES DEL PROCEDIMIENTO ANESTÉSICO</Text>
        <View style={f.fila}>
          <LineaLlenado et="FECHA" val={r.evalFecha} w="50%" />
          <LineaLlenado et="HORA" val={r.evalHora} w="50%" />
        </View>
        <GrupoCasillas
          et="Cuenta con el consentimiento informado para anestesia y/o sedación:"
          opciones={["Sí", "No"]}
          seleccion={r.consentimientoAnestesia === null || r.consentimientoAnestesia === undefined ? null : r.consentimientoAnestesia ? "Sí" : "No"}
        />
        <GrupoCasillas
          et="Se corroboró la identificación del paciente, su estado actual, el diagnóstico y el procedimiento programado:"
          opciones={["Sí", "No"]}
          seleccion={r.identificacionCorroborada === null || r.identificacionCorroborada === undefined ? null : r.identificacionCorroborada ? "Sí" : "No"}
        />

        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e5aa8", marginTop: 3 }}>
          VERIFICACIÓN DEL EQUIPO Y DEL MONITOREO ANTES DE LA ANESTESIA
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {VERIFICACION_EQUIPO.map((x) => (
            <Casilla key={x} label={x} marcada={r.verificacionEquipo?.includes(x)} ancho="24%" />
          ))}
        </View>
        <Text style={{ fontSize: 6.5, fontFamily: "Helvetica-Bold", marginTop: 2 }}>Opcionales</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {VERIFICACION_OPCIONALES.map((x) => (
            <Casilla key={x} label={x} marcada={r.verificacionEquipo?.includes(x)} ancho="24%" />
          ))}
        </View>

        <Tabla style={{ marginTop: 4 }}>
          <Fila>
            <Th>T/A</Th>
            <Th>FC</Th>
            <Th>FR</Th>
            <Th>Temp</Th>
            <Th>SpO2</Th>
          </Fila>
          <Fila>
            <Td align="center" alto={13}>{r.signosBasales?.ta ?? ""}</Td>
            <Td align="center" alto={13}>{r.signosBasales?.fc ?? ""}</Td>
            <Td align="center" alto={13}>{r.signosBasales?.fr ?? ""}</Td>
            <Td align="center" alto={13}>{r.signosBasales?.temp ?? ""}</Td>
            <Td align="center" alto={13}>{r.signosBasales?.spo2 ?? ""}</Td>
          </Fila>
        </Tabla>

        <Tabla>
          <Fila>
            <Th w={2}>Medicación preanestésica</Th>
            <Th w={1}>Dosis</Th>
            <Th w={1}>Vía</Th>
            <Th w={1}>Fecha</Th>
            <Th w={0.8}>Hora</Th>
            <Th w={1.4}>Efecto</Th>
          </Fila>
          {Array.from({ length: Math.max(3, medicacion.length) }, (_, i) => {
            const m = medicacion[i];
            return (
              <Fila key={i}>
                <Td w={2} alto={12}>{m?.medicamento ?? ""}</Td>
                <Td w={1} alto={12} align="center">{m?.dosis ?? ""}</Td>
                <Td w={1} alto={12} align="center">{m?.via ?? ""}</Td>
                <Td w={1} alto={12} align="center">{m?.fecha ?? ""}</Td>
                <Td w={0.8} alto={12} align="center">{m?.hora ?? ""}</Td>
                <Td w={1.4} alto={12}>{m?.efecto ?? ""}</Td>
              </Fila>
            );
          })}
        </Tabla>
        <Text style={{ fontSize: 7, fontFamily: "Helvetica-Bold", color: "#1e5aa8" }}>OBSERVACIONES</Text>
        <BloqueTexto val={r.evalObservaciones} renglones={1} />

        <Text style={f.seccion}>REGISTRO ANESTÉSICO</Text>
        <View style={f.fila}>
          <LineaLlenado et="HORAS DE AYUNO" val={r.horasAyuno} w="33%" />
          <LineaLlenado et="PREMEDICACIÓN" val={r.premedicacion ? r.premedicacionDetalle ?? "Sí" : "No"} w="34%" />
          <LineaLlenado et="CALIBRE DEL CATÉTER" val={r.calibreCateter} w="33%" />
        </View>
        <View style={f.fila}>
          <LineaLlenado et="ACCESO VENOSO" val={r.accesoVenoso ? "Sí" : "No"} w="33%" />
          <LineaLlenado et="SITIO" val={r.accesoSitio} w="67%" />
        </View>
        <GrupoCasillas et="Posición del paciente:" opciones={POSICION_PACIENTE} seleccion={r.posicionPaciente} />
        <GrupoCasillas et="Posición de los brazos:" opciones={POSICION_BRAZOS} seleccion={r.posicionBrazos} />
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <Casilla label="Protección de los ojos" marcada={r.proteccionOjos} />
          <Casilla label="Protección de prominencias óseas" marcada={r.proteccionProminencias} />
          <Casilla label="Aplicación de torniquete" marcada={r.torniquete} />
        </View>
        {r.torniquete ? (
          <View style={f.fila}>
            <LineaLlenado et="SITIO DEL TORNIQUETE" val={r.torniqueteSitio} w="40%" />
            <LineaLlenado et="INICIA" val={r.torniqueteInicia} w="30%" />
            <LineaLlenado et="TERMINA" val={r.torniqueteTermina} w="30%" />
          </View>
        ) : null}
        <GrupoCasillas et="Técnica anestésica:" opciones={TECNICA_ANESTESICA} seleccion={r.tecnicaAnestesica} />

        <SubBloque
          titulo="ANESTESIA LOCAL"
          campos={[
            ["SITIO", r.anestesiaLocal?.sitio],
            ["MEDICAMENTO UTILIZADO", r.anestesiaLocal?.medicamento],
            ["CON EPINEFRINA", r.anestesiaLocal?.epinefrina],
            ["LATENCIA", r.anestesiaLocal?.latencia],
            ["DOSIS", r.anestesiaLocal?.dosis],
          ]}
        />
        <SubBloque
          titulo="ANESTESIA REGIONAL"
          campos={[
            ["TIPO", r.anestesiaRegional?.tipo],
            ["NIVEL", r.anestesiaRegional?.nivel],
            ["TIPO DE AGUJA", r.anestesiaRegional?.tipoAguja],
            ["CALIBRE DE LA AGUJA", r.anestesiaRegional?.calibreAguja],
            ["CATÉTER", r.anestesiaRegional?.cateter],
            ["MEDICAMENTO UTILIZADO", r.anestesiaRegional?.medicamento],
            ["CON EPINEFRINA", r.anestesiaRegional?.epinefrina],
            ["LATENCIA", r.anestesiaRegional?.latencia],
            ["DOSIS", r.anestesiaRegional?.dosis],
            ["DIFICULTADES TÉCNICAS", r.anestesiaRegional?.dificultades],
          ]}
        />
        <SubBloque
          titulo="ANESTESIA GENERAL"
          campos={[
            ["INDUCCIÓN", r.anestesiaGeneral?.induccion],
            ["MEDICAMENTO UTILIZADO", r.anestesiaGeneral?.medicamento],
            ["INTUBACIÓN", r.anestesiaGeneral?.intubacion],
            ["CALIBRE / TIPO DE CÁNULA", r.anestesiaGeneral?.canula],
            ["GLOBO / PRESIÓN", r.anestesiaGeneral?.globo],
            ["INTUBACIÓN TRAUMÁTICA", r.anestesiaGeneral?.traumatica],
            ["TIPO DE VENTILACIÓN", r.anestesiaGeneral?.ventilacion],
            ["VOLUMEN CORRIENTE", r.anestesiaGeneral?.volumenCorriente],
            ["FRECUENCIA RESPIRATORIA", r.anestesiaGeneral?.frecuencia],
            ["PRESIÓN DE VÍAS AÉREAS", r.anestesiaGeneral?.presionVias],
            ["FLUJO DE OXÍGENO / N2O / AIRE", r.anestesiaGeneral?.flujos],
            ["PEEP", r.anestesiaGeneral?.peep],
            ["TIPO DE CIRCUITO", r.anestesiaGeneral?.circuito],
            ["MASCARILLA LARÍNGEA / CALIBRE", r.anestesiaGeneral?.mascarilla],
            ["OTRO DISPOSITIVO", r.anestesiaGeneral?.otroDispositivo],
          ]}
        />
        {r.casoObstetrico ? (
          <SubBloque
            titulo="CASO OBSTÉTRICO"
            campos={[
              ["PARTO NORMAL", r.casoObstetrico.partoNormal],
              ["CESÁREA", r.casoObstetrico.cesarea],
              ["EXPULSIÓN O EXTRACCIÓN DE LA PLACENTA", r.casoObstetrico.placenta],
              ["RECIÉN NACIDO — SEXO", r.casoObstetrico.rnSexo],
              ["PESO", r.casoObstetrico.rnPeso],
              ["TALLA", r.casoObstetrico.rnTalla],
              ["HORA DE NACIMIENTO", r.casoObstetrico.rnHora],
              ["APGAR 1 / 5 / 10 MIN", r.casoObstetrico.apgar],
              ["AL SALIR DEL QUIRÓFANO", r.casoObstetrico.alSalir],
            ]}
          />
        ) : null}

        <View style={[f.firmas, { marginTop: 2 }]} wrap={false}>
          <FirmaEnBlanco
            titulo={d.anestesiologo.nombre}
            subtitulo={`Nombre completo y firma del anestesiólogo${d.anestesiologo.cedula ? ` · Céd. ${d.anestesiologo.cedula}` : ""}`}
            firma={d.anestesiologo.firma}
            compacta
          />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>

      {/* ── Hoja 18: registro transanestésico ── */}
      <Page size="LETTER" style={f.pageDensa}>
        <Text style={f.titulo}>REGISTRO TRANSANESTÉSICO</Text>
        <View style={f.fila}>
          <LineaLlenado et="AGENTES" val={r.agentes} w="60%" />
          <LineaLlenado et="TIPO DE VENTILACIÓN" val={r.tipoVentilacion} w="40%" />
        </View>

        <Text style={{ fontSize: 6.5, color: "#555", marginBottom: 2 }}>
          Aspa = T.A. · punto lleno = frecuencia cardiaca · punto hueco = respiración · escala 30 a 240
        </Text>
        <GraficaTransanestesica lecturas={lecturas} />

        {/* Horas y tiempos quirúrgicos */}
        <Tabla style={{ marginTop: 4 }}>
          <Fila>
            <Th w={2.4} {...chico} align="left">HORAS</Th>
            {lecturas.slice(0, columnas).map((l, i) => (
              <Th key={i} w={1} {...chico}>{l.hora ?? ""}</Th>
            ))}
          </Fila>
          {[
            { et: "Saturación de O2", get: (l: LecturaTransanestesica) => l.spo2 },
            { et: "Frac. final esp. CO2", get: (l: LecturaTransanestesica) => l.etco2 },
            { et: "PVC / PAM", get: (l: LecturaTransanestesica) => l.pvcPam },
            { et: "Análisis biespectral (B/S)", get: (l: LecturaTransanestesica) => l.bis },
            { et: "Otros", get: (l: LecturaTransanestesica) => l.otros },
          ].map((fila) => (
            <Fila key={fila.et}>
              <Th w={2.4} {...chico} align="left">{fila.et}</Th>
              {lecturas.slice(0, columnas).map((l, i) => (
                <Td key={i} w={1} {...chico} align="center">{fila.get(l) ?? ""}</Td>
              ))}
            </Fila>
          ))}
        </Tabla>

        <Tabla>
          <Fila>
            <Th w={2.4} {...chico} align="left">TIEMPOS 1 AL 6</Th>
            {TIEMPOS_TRANSANESTESICOS.map((tt) => (
              <Th key={tt.clave} w={1} {...chico}>{`${tt.numero}. ${tt.etiqueta}`}</Th>
            ))}
          </Fila>
          <Fila>
            <Td w={2.4} {...chico} />
            {TIEMPOS_TRANSANESTESICOS.map((tt) => (
              <Td key={tt.clave} w={1} {...chico} align="center">{r.tiempos?.[tt.clave] ?? ""}</Td>
            ))}
          </Fila>
        </Tabla>

        <Tabla>
          <Fila>
            <Th w={2.4} {...chico} align="left">FÁRMACOS</Th>
            <Th w={1} {...chico}>Dosis</Th>
            <Th w={1} {...chico}>Vía</Th>
          </Fila>
          {Array.from({ length: Math.max(RENGLONES_FARMACOS, farmacos.length) }, (_, i) => {
            const m = farmacos[i];
            return (
              <Fila key={i}>
                <Td w={2.4} {...chico}>{m?.nombre ?? ""}</Td>
                <Td w={1} {...chico} align="center">{m?.dosis ?? ""}</Td>
                <Td w={1} {...chico} align="center">{m?.via ?? ""}</Td>
              </Fila>
            );
          })}
        </Tabla>

        {/* Balance hídrico */}
        <View style={{ flexDirection: "row" }}>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, marginRight: 4 }}>
            <Tabla>
              <Fila>
                <Th w={2} {...chico} align="left">EGRESOS</Th>
                <Th w={1} {...chico}>mL</Th>
              </Fila>
              {EGRESOS.map((e) => (
                <Fila key={e.campo}>
                  <Td w={2} {...chico}>{e.etiqueta}</Td>
                  <Td w={1} {...chico} align="right">{r.egresos?.[e.campo] ?? ""}</Td>
                </Fila>
              ))}
              <Fila>
                <Th w={2} {...chico} align="right">Total</Th>
                <Th w={1} {...chico} align="right">{r.egresos?.total ?? ""}</Th>
              </Fila>
            </Tabla>
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
            <Tabla>
              <Fila>
                <Th w={2} {...chico} align="left">INGRESOS</Th>
                <Th w={1} {...chico}>mL</Th>
              </Fila>
              {INGRESOS.map((e) => (
                <Fila key={e.campo}>
                  <Td w={2} {...chico}>{e.etiqueta}</Td>
                  <Td w={1} {...chico} align="right">{r.ingresos?.[e.campo] ?? ""}</Td>
                </Fila>
              ))}
              <Fila>
                <Th w={2} {...chico} align="right">Total</Th>
                <Th w={1} {...chico} align="right">{r.ingresos?.total ?? ""}</Th>
              </Fila>
            </Tabla>
          </View>
        </View>

        <View style={f.fila}>
          <LineaLlenado et="BALANCE HÍDRICO" val={r.balanceHidrico} w="50%" />
          <LineaLlenado et="ALDRETE" val={r.aldreteFinal !== null && r.aldreteFinal !== undefined ? String(r.aldreteFinal) : null} w="50%" />
        </View>
        <GrupoCasillas et="El paciente de la sala quirúrgica pasa a:" opciones={DESTINO_SALA} seleccion={r.pasaA} />

        <View style={[f.firmas, { marginTop: 12 }]}>
          <FirmaEnBlanco
            titulo={d.anestesiologo.nombre}
            subtitulo="Nombre y firma del médico anestesiólogo"
            firma={d.anestesiologo.firma}
          />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}

// ═══════════════ Hoja 19: RECUPERACIÓN ANESTÉSICA Y NOTA POST-ANESTÉSICA ═══════════════

export type NotaPostanestesicaData = {
  est: Establecimiento;
  paciente: PacientePdf;
  anestesiologo: AnestesiologoPdf;
  n: {
    aldrete?: Record<string, Record<string, number | null>> | null;
    ramsay?: number | null;
    bromage?: number | null;
    nota?: string | null;
    planOxigeno?: string | null;
    planSolucionesIV?: string | null;
    planMedicamentos?: string | null;
    planComponentesSanguineos?: string | null;
    planManejoDolor?: string | null;
    motivoEgreso?: string | null;
    pasaA?: string | null;
    fechaHora?: string | null;
  };
  fecha: string;
  hash?: string;
};

export function NotaPostanestesicaPdf({ d }: { d: NotaPostanestesicaData }) {
  const { n } = d;
  const plan: Record<string, string | null | undefined> = {
    planOxigeno: n.planOxigeno,
    planSolucionesIV: n.planSolucionesIV,
    planMedicamentos: n.planMedicamentos,
    planComponentesSanguineos: n.planComponentesSanguineos,
    planManejoDolor: n.planManejoDolor,
  };
  const totalEn = (min: number) => {
    const col = n.aldrete?.[String(min)];
    if (!col) return "";
    const suma = ALDRETE_CRITERIOS.reduce((s, c) => s + (col[c.campo] ?? 0), 0);
    return Object.values(col).some((x) => x !== null && x !== undefined) ? String(suma) : "";
  };

  return (
    <Document title={`Nota post-anestésica ${d.paciente.expediente}`}>
      <Page size="LETTER" style={f.pageDensa}>
        <Encabezado est={d.est} titulo="RECUPERACIÓN ANESTÉSICA — NOTA POST-ANESTÉSICA" />
        <View style={f.fila}>
          <LineaLlenado et="PACIENTE" val={d.paciente.nombre} w="65%" />
          <LineaLlenado et="EXPEDIENTE" val={d.paciente.expediente} w="35%" />
        </View>

        <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1e5aa8", marginTop: 4 }}>
          ESCALA DE ALDRETE MODIFICADA
        </Text>
        <Tabla>
          <Fila>
            <Th w={1.3} {...chico} align="left">Características</Th>
            <Th w={4} {...chico} align="left">Descripción</Th>
            {ALDRETE_TIEMPOS.map((m) => (
              <Th key={m} w={0.6} {...chico}>{String(m)}</Th>
            ))}
          </Fila>
          {ALDRETE_CRITERIOS.map((c) => (
            <Fila key={c.campo}>
              <Th w={1.3} {...chico} align="left">{c.etiqueta}</Th>
              <TdVista w={4} style={{ paddingVertical: 0.8, paddingHorizontal: 2 }}>
                {c.niveles.map((nv) => (
                  <Text key={nv.puntos} style={{ fontSize: 5.8 }}>{`${nv.texto} "${nv.puntos}"`}</Text>
                ))}
              </TdVista>
              {ALDRETE_TIEMPOS.map((m) => (
                <Td key={m} w={0.6} {...chico} align="center">
                  {n.aldrete?.[String(m)]?.[c.campo] ?? ""}
                </Td>
              ))}
            </Fila>
          ))}
          <Fila>
            <Th w={5.3} {...chico} align="right">TOTAL</Th>
            {ALDRETE_TIEMPOS.map((m) => (
              <Th key={m} w={0.6} {...chico} align="center">{totalEn(m)}</Th>
            ))}
          </Fila>
        </Tabla>

        <View style={{ flexDirection: "row", marginTop: 3 }}>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, marginRight: 4 }}>
            <Tabla>
              <Fila>
                <Th w={0.6} {...chico}>Nivel</Th>
                <Th w={3} {...chico} align="left">ESCALA DE SEDACIÓN DE RAMSAY</Th>
              </Fila>
              {RAMSAY.map((x) => (
                <Fila key={x.nivel}>
                  <Td w={0.6} {...chico} align="center">{String(x.nivel)}</Td>
                  <TdVista w={3} style={{ paddingVertical: 0.8, paddingHorizontal: 2 }}>
                    <Casilla label={`${x.estado} — ${x.texto}`} marcada={n.ramsay === x.nivel} />
                  </TdVista>
                </Fila>
              ))}
              <Fila>
                <Th w={0.6} {...chico} align="center">Calif.</Th>
                <Th w={3} {...chico}>{n.ramsay !== null && n.ramsay !== undefined ? String(n.ramsay) : ""}</Th>
              </Fila>
            </Tabla>
          </View>
          <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
            <Tabla>
              <Fila>
                <Th w={0.6} {...chico}>Nivel</Th>
                <Th w={3} {...chico} align="left">ESCALA DE BROMAGE — BLOQUEO MOTOR</Th>
              </Fila>
              {BROMAGE.map((x) => (
                <Fila key={x.nivel}>
                  <Td w={0.6} {...chico} align="center">{String(x.nivel)}</Td>
                  <TdVista w={3} style={{ paddingVertical: 0.8, paddingHorizontal: 2 }}>
                    <Casilla label={x.texto} marcada={n.bromage === x.nivel} />
                  </TdVista>
                </Fila>
              ))}
              <Fila>
                <Th w={0.6} {...chico} align="center">Calif.</Th>
                <Th w={3} {...chico}>{n.bromage !== null && n.bromage !== undefined ? String(n.bromage) : ""}</Th>
              </Fila>
            </Tabla>
          </View>
        </View>

        <Text style={f.seccion}>NOTA POST-ANESTÉSICA</Text>
        <BloqueTexto val={n.nota} renglones={7} />

        <Text style={f.seccion}>PLAN POST-ANESTÉSICO</Text>
        <Tabla>
          {PLAN_POSTANESTESICO.map((p) => (
            <Fila key={p.campo}>
              <Th w={1.4} align="left">{p.etiqueta}</Th>
              <Td w={4} alto={14}>{plan[p.campo] ?? ""}</Td>
            </Fila>
          ))}
        </Tabla>

        <Text style={{ fontSize: 7.5, fontFamily: "Helvetica-Bold", color: "#1e5aa8", marginTop: 4 }}>
          MOTIVO DE EGRESO DEL ÁREA DE RECUPERACIÓN
        </Text>
        <Renglones n={2} />
        <GrupoCasillas et="El paciente de recuperación pasa a:" opciones={DESTINO_RECUPERACION} seleccion={n.pasaA} />
        <LineaLlenado et="MOTIVO REGISTRADO" val={n.motivoEgreso} />
        <View style={f.fila}>
          <LineaLlenado et="FECHA Y HORA" val={n.fechaHora ?? d.fecha} w="100%" />
        </View>

        <View style={[f.firmas, { marginTop: 6 }]} wrap={false}>
          <FirmaEnBlanco
            titulo={d.anestesiologo.nombre}
            subtitulo={`Nombre y firma del médico anestesiólogo${d.anestesiologo.cedula ? ` · Céd. ${d.anestesiologo.cedula}` : ""}`}
            firma={d.anestesiologo.firma}
            compacta
          />
        </View>
        <PieLegal fecha={d.fecha} hash={d.hash} />
      </Page>
    </Document>
  );
}
