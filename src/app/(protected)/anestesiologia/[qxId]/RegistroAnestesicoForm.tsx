"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { guardarRegistroAnestesico } from "@/actions/anestesia";
import { Card, CardHeader, CardBody, Field, Input, Textarea, ErrorMsg, OkMsg, Button, Badge, Label } from "@/components/ui";
import { GrupoCheck, GrupoRadio, SiNo } from "@/components/Casillas";
import { FilasDinamicas } from "@/components/FilasDinamicas";
import { SignaturePad } from "@/components/SignaturePad";
import {
  VERIFICACION_EQUIPO,
  VERIFICACION_OPCIONALES,
  POSICION_PACIENTE,
  POSICION_BRAZOS,
  TECNICA_ANESTESICA,
  TIPO_VENTILACION,
  TIEMPOS_TRANSANESTESICOS,
  EGRESOS,
  INGRESOS,
  DESTINO_SALA,
} from "@/lib/escalasAnestesia";

const VIAS = ["IV", "IM", "SC", "Inhalada", "Peridural", "Subaracnoidea", "Tópica", "Oral"];

export type RegistroInicial = {
  evalFecha: string;
  evalHora: string;
  consentimientoAnestesia: boolean | null;
  identificacionCorroborada: boolean | null;
  verificacionEquipo: string[];
  signosBasales: Record<string, string>;
  medicacion: Record<string, string>[];
  evalObservaciones: string;
  horasAyuno: string;
  premedicacion: boolean | null;
  premedicacionDetalle: string;
  accesoVenoso: boolean | null;
  accesoSitio: string;
  calibreCateter: string;
  posicionPaciente: string;
  posicionBrazos: string;
  proteccionOjos: boolean | null;
  proteccionProminencias: boolean | null;
  torniquete: boolean | null;
  torniqueteSitio: string;
  torniqueteInicia: string;
  torniqueteTermina: string;
  tecnicaAnestesica: string;
  local: Record<string, string>;
  regional: Record<string, string>;
  general: Record<string, string>;
  obstetrico: Record<string, string>;
  agentes: string;
  tiempos: Record<string, string>;
  tipoVentilacion: string;
  egresos: Record<string, string>;
  ingresos: Record<string, string>;
  balanceHidrico: string;
  aldreteFinal: string;
  pasaA: string;
  lecturas: Record<string, string>[];
  farmacos: Record<string, string>[];
};

function Botones({ editable }: { editable: boolean }) {
  const { pending } = useFormStatus();
  if (!editable) return null;
  return (
    <div className="flex justify-end gap-3">
      <Button type="submit" name="_accion" value="borrador" variant="secondary" disabled={pending}>
        {pending ? "Guardando…" : "Guardar borrador"}
      </Button>
      <Button
        type="submit"
        name="_accion"
        value="firmar"
        disabled={pending}
        onClick={(e) => {
          if (!window.confirm("Al firmar, el registro anestésico queda INMUTABLE. ¿Firmar?")) e.preventDefault();
        }}
      >
        Firmar registro
      </Button>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-lg border border-slate-200 p-3">
      <legend className="px-1 text-sm font-semibold text-blue-800">{titulo}</legend>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

/** Campos de un bloque Json: los nombres viajan como `prefijo.campo`. */
function CamposJson({
  prefijo,
  campos,
  valores,
  editable,
}: {
  prefijo: string;
  campos: { campo: string; etiqueta: string }[];
  valores: Record<string, string>;
  editable: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {campos.map((c) => (
        <Field key={c.campo} label={c.etiqueta}>
          <Input
            name={`${prefijo}.${c.campo}`}
            defaultValue={valores[c.campo] ?? ""}
            readOnly={!editable}
            disabled={!editable}
          />
        </Field>
      ))}
    </div>
  );
}

export function RegistroAnestesicoForm({
  qxId,
  editable,
  firmada,
  inicial,
}: {
  qxId: string;
  editable: boolean;
  firmada: boolean;
  inicial: RegistroInicial;
}) {
  const [state, formAction] = useActionState(
    async (prev: { error?: string; ok?: boolean }, fd: FormData) =>
      guardarRegistroAnestesico(qxId, fd.get("_accion") === "firmar", prev, fd),
    {},
  );
  const ro = editable ? {} : { readOnly: true, disabled: true };

  return (
    <Card>
      <CardHeader
        title="Registro anestésico y transanestésico"
        subtitle="Hojas oficiales 17, 18 y 20: evaluación inmediata previa, registro y cuadrícula de signos vitales."
        action={firmada ? <Badge tone="green">Firmado — inmutable</Badge> : <Badge tone="amber">Borrador</Badge>}
      />
      <CardBody>
        <form action={formAction} className="space-y-4">
          <ErrorMsg>{state.error}</ErrorMsg>
          {state.ok && <OkMsg>Guardado.</OkMsg>}

          <Bloque titulo="Evaluación inmediatamente antes del procedimiento anestésico">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Field label="Fecha">
                <Input name="evalFecha" type="date" defaultValue={inicial.evalFecha} {...ro} />
              </Field>
              <Field label="Hora">
                <Input name="evalHora" type="time" defaultValue={inicial.evalHora} {...ro} />
              </Field>
              <SiNo
                name="consentimientoAnestesia"
                label="Consentimiento para anestesia y/o sedación"
                valor={inicial.consentimientoAnestesia}
                editable={editable}
              />
              <SiNo
                name="identificacionCorroborada"
                label="Identificación, estado, diagnóstico y procedimiento corroborados"
                valor={inicial.identificacionCorroborada}
                editable={editable}
              />
            </div>
            <GrupoCheck
              name="verificacionEquipo"
              label="Verificación del equipo y del monitoreo"
              opciones={[...VERIFICACION_EQUIPO, ...VERIFICACION_OPCIONALES]}
              valores={inicial.verificacionEquipo}
              editable={editable}
              columnas={3}
            />
            <CamposJson
              prefijo="signosBasales"
              editable={editable}
              valores={inicial.signosBasales}
              campos={[
                { campo: "ta", etiqueta: "T/A basal" },
                { campo: "fc", etiqueta: "FC" },
                { campo: "fr", etiqueta: "FR" },
                { campo: "temp", etiqueta: "Temperatura" },
                { campo: "spo2", etiqueta: "SpO2" },
              ]}
            />
            <div>
              <Label>Medicación preanestésica</Label>
              <FilasDinamicas
                editable={editable}
                inicial={inicial.medicacion}
                minimo={2}
                etiquetaAgregar="Agregar medicamento"
                columnas={[
                  { name: "mp_medicamento", label: "Medicamento" },
                  { name: "mp_dosis", label: "Dosis", ancho: "w-24" },
                  { name: "mp_via", label: "Vía", ancho: "w-28", opciones: VIAS },
                  { name: "mp_fecha", label: "Fecha", type: "date", ancho: "w-36" },
                  { name: "mp_hora", label: "Hora", type: "time", ancho: "w-28" },
                  { name: "mp_efecto", label: "Efecto" },
                ]}
              />
            </div>
            <Field label="Observaciones">
              <Textarea name="evalObservaciones" rows={2} defaultValue={inicial.evalObservaciones} {...ro} />
            </Field>
          </Bloque>

          <Bloque titulo="Registro anestésico">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Horas de ayuno">
                <Input name="horasAyuno" defaultValue={inicial.horasAyuno} {...ro} />
              </Field>
              <SiNo name="premedicacion" label="Premedicación" valor={inicial.premedicacion} editable={editable} />
              <Field label="¿Qué se utilizó?">
                <Input name="premedicacionDetalle" defaultValue={inicial.premedicacionDetalle} {...ro} />
              </Field>
              <SiNo name="accesoVenoso" label="Acceso venoso" valor={inicial.accesoVenoso} editable={editable} />
              <Field label="Sitio">
                <Input name="accesoSitio" defaultValue={inicial.accesoSitio} {...ro} />
              </Field>
              <Field label="Calibre del catéter">
                <Input name="calibreCateter" defaultValue={inicial.calibreCateter} {...ro} />
              </Field>
            </div>
            <GrupoRadio
              name="posicionPaciente"
              label="Posición del paciente"
              opciones={POSICION_PACIENTE}
              valor={inicial.posicionPaciente}
              editable={editable}
              columnas={3}
            />
            <GrupoRadio
              name="posicionBrazos"
              label="Posición de los brazos"
              opciones={POSICION_BRAZOS}
              valor={inicial.posicionBrazos}
              editable={editable}
              columnas={2}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SiNo name="proteccionOjos" label="Protección de los ojos" valor={inicial.proteccionOjos} editable={editable} />
              <SiNo
                name="proteccionProminencias"
                label="Protección de prominencias óseas"
                valor={inicial.proteccionProminencias}
                editable={editable}
              />
              <SiNo name="torniquete" label="Aplicación de torniquete" valor={inicial.torniquete} editable={editable} />
              <Field label="Sitio del torniquete">
                <Input name="torniqueteSitio" defaultValue={inicial.torniqueteSitio} {...ro} />
              </Field>
              <Field label="Inicia">
                <Input name="torniqueteInicia" type="time" defaultValue={inicial.torniqueteInicia} {...ro} />
              </Field>
              <Field label="Termina">
                <Input name="torniqueteTermina" type="time" defaultValue={inicial.torniqueteTermina} {...ro} />
              </Field>
            </div>
            <GrupoRadio
              name="tecnicaAnestesica"
              label="Técnica anestésica"
              opciones={TECNICA_ANESTESICA}
              valor={inicial.tecnicaAnestesica}
              editable={editable}
              columnas={2}
            />
          </Bloque>

          <Bloque titulo="Anestesia local">
            <CamposJson
              prefijo="local"
              editable={editable}
              valores={inicial.local}
              campos={[
                { campo: "sitio", etiqueta: "Sitio" },
                { campo: "medicamento", etiqueta: "Medicamento utilizado" },
                { campo: "epinefrina", etiqueta: "Con epinefrina" },
                { campo: "latencia", etiqueta: "Latencia" },
                { campo: "dosis", etiqueta: "Dosis" },
              ]}
            />
          </Bloque>

          <Bloque titulo="Anestesia regional">
            <CamposJson
              prefijo="regional"
              editable={editable}
              valores={inicial.regional}
              campos={[
                { campo: "tipo", etiqueta: "Tipo" },
                { campo: "nivel", etiqueta: "Nivel" },
                { campo: "tipoAguja", etiqueta: "Tipo de aguja" },
                { campo: "calibreAguja", etiqueta: "Calibre de la aguja" },
                { campo: "cateter", etiqueta: "Catéter" },
                { campo: "medicamento", etiqueta: "Medicamento utilizado" },
                { campo: "epinefrina", etiqueta: "Con epinefrina" },
                { campo: "latencia", etiqueta: "Latencia" },
                { campo: "dosis", etiqueta: "Dosis" },
                { campo: "dificultades", etiqueta: "Dificultades técnicas" },
              ]}
            />
          </Bloque>

          <Bloque titulo="Anestesia general">
            <CamposJson
              prefijo="general"
              editable={editable}
              valores={inicial.general}
              campos={[
                { campo: "induccion", etiqueta: "Inducción (IV / inhalatoria)" },
                { campo: "medicamento", etiqueta: "Medicamento utilizado" },
                { campo: "intubacion", etiqueta: "Intubación (oral / nasal)" },
                { campo: "canula", etiqueta: "Calibre y tipo de cánula" },
                { campo: "globo", etiqueta: "Globo / presión" },
                { campo: "traumatica", etiqueta: "Intubación traumática" },
                { campo: "ventilacion", etiqueta: "Tipo de ventilación" },
                { campo: "volumenCorriente", etiqueta: "Volumen corriente" },
                { campo: "frecuencia", etiqueta: "Frecuencia respiratoria" },
                { campo: "presionVias", etiqueta: "Presión de vías aéreas" },
                { campo: "flujos", etiqueta: "Flujo de O2 / N2O / aire" },
                { campo: "peep", etiqueta: "PEEP" },
                { campo: "circuito", etiqueta: "Tipo de circuito" },
                { campo: "mascarilla", etiqueta: "Mascarilla laríngea / calibre" },
                { campo: "otroDispositivo", etiqueta: "Otro dispositivo" },
              ]}
            />
          </Bloque>

          <Bloque titulo="Caso obstétrico (si aplica)">
            <CamposJson
              prefijo="obstetrico"
              editable={editable}
              valores={inicial.obstetrico}
              campos={[
                { campo: "partoNormal", etiqueta: "Parto normal" },
                { campo: "cesarea", etiqueta: "Cesárea" },
                { campo: "placenta", etiqueta: "Expulsión o extracción de la placenta" },
                { campo: "rnSexo", etiqueta: "Recién nacido — sexo" },
                { campo: "rnPeso", etiqueta: "Peso" },
                { campo: "rnTalla", etiqueta: "Talla" },
                { campo: "rnHora", etiqueta: "Hora de nacimiento" },
                { campo: "apgar", etiqueta: "Apgar 1 / 5 / 10 min" },
                { campo: "alSalir", etiqueta: "Al salir del quirófano" },
              ]}
            />
          </Bloque>

          <Bloque titulo="Registro transanestésico">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Agentes">
                <Input name="agentes" defaultValue={inicial.agentes} placeholder="Sevoflurano 2% · O2/aire" {...ro} />
              </Field>
              <GrupoRadio
                name="tipoVentilacion"
                label="Tipo de ventilación"
                opciones={TIPO_VENTILACION}
                valor={inicial.tipoVentilacion}
                editable={editable}
                columnas={2}
              />
            </div>

            <div>
              <Label>Tiempos quirúrgicos</Label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {TIEMPOS_TRANSANESTESICOS.map((t) => (
                  <Field key={t.clave} label={`${t.numero}. ${t.etiqueta}`}>
                    <Input
                      name={`tiempo.${t.clave}`}
                      type="time"
                      defaultValue={inicial.tiempos[t.clave] ?? ""}
                      {...ro}
                    />
                  </Field>
                ))}
              </div>
            </div>

            <div>
              <Label>Cuadrícula de signos vitales</Label>
              <p className="mb-1 text-xs text-slate-500">
                Un renglón por lectura. El minuto es la posición en la gráfica; T.A., frecuencia cardíaca y respiración
                se trazan como curva en el PDF.
              </p>
              <FilasDinamicas
                editable={editable}
                inicial={inicial.lecturas}
                minimo={6}
                etiquetaAgregar="Agregar lectura"
                columnas={[
                  { name: "lec_minuto", label: "Min.", type: "number", ancho: "w-20" },
                  { name: "lec_hora", label: "Hora", type: "time", ancho: "w-28" },
                  { name: "lec_taSistolica", label: "TA sist.", type: "number", ancho: "w-20" },
                  { name: "lec_taDiastolica", label: "TA diast.", type: "number", ancho: "w-20" },
                  { name: "lec_fc", label: "FC", type: "number", ancho: "w-20" },
                  { name: "lec_fr", label: "FR", type: "number", ancho: "w-20" },
                  { name: "lec_temperatura", label: "Temp.", type: "number", step: "0.1", ancho: "w-20" },
                  { name: "lec_spo2", label: "SpO2", type: "number", ancho: "w-20" },
                  { name: "lec_etco2", label: "CO2 esp.", ancho: "w-20" },
                  { name: "lec_pvcPam", label: "PVC/PAM", ancho: "w-24" },
                  { name: "lec_bis", label: "B/S", ancho: "w-20" },
                  { name: "lec_otros", label: "Otros", ancho: "w-24" },
                ]}
              />
            </div>

            <div>
              <Label>Fármacos administrados</Label>
              <FilasDinamicas
                editable={editable}
                inicial={inicial.farmacos}
                minimo={4}
                etiquetaAgregar="Agregar fármaco"
                columnas={[
                  { name: "fa_nombre", label: "Fármaco" },
                  { name: "fa_dosis", label: "Dosis", ancho: "w-32" },
                  { name: "fa_via", label: "Vía", ancho: "w-32", opciones: VIAS },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Egresos (mL)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {EGRESOS.map((e) => (
                    <Field key={e.campo} label={e.etiqueta}>
                      <Input name={`egreso.${e.campo}`} type="number" defaultValue={inicial.egresos[e.campo] ?? ""} {...ro} />
                    </Field>
                  ))}
                </div>
              </div>
              <div>
                <Label>Ingresos (mL)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {INGRESOS.map((e) => (
                    <Field key={e.campo} label={e.etiqueta}>
                      <Input name={`ingreso.${e.campo}`} type="number" defaultValue={inicial.ingresos[e.campo] ?? ""} {...ro} />
                    </Field>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Balance hídrico">
                <Input name="balanceHidrico" defaultValue={inicial.balanceHidrico} placeholder="+260 mL" {...ro} />
              </Field>
              <Field label="Aldrete al salir de quirófano">
                <Input name="aldreteFinal" type="number" min="0" max="10" defaultValue={inicial.aldreteFinal} {...ro} />
              </Field>
              <GrupoRadio
                name="pasaA"
                label="El paciente de la sala quirúrgica pasa a"
                opciones={DESTINO_SALA}
                valor={inicial.pasaA}
                editable={editable}
              />
            </div>

            {editable && (
              <div className="max-w-sm">
                <Label>Firma del anestesiólogo (tableta)</Label>
                <SignaturePad name="firmaAnestesiologo" label="Firma del anestesiólogo" />
              </div>
            )}
          </Bloque>

          <Botones editable={editable} />
        </form>
      </CardBody>
    </Card>
  );
}
