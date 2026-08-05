"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { guardarValoracionPre } from "@/actions/anestesia";
import { Card, CardHeader, CardBody, Field, Input, Textarea, ErrorMsg, OkMsg, Button, Badge, Label } from "@/components/ui";
import { GrupoCheck, GrupoRadio } from "@/components/Casillas";
import { SignaturePad } from "@/components/SignaturePad";
import {
  ASA,
  ANGINA_CANADIENSE,
  GOLDMAN,
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
  LABORATORIO_CAMPOS,
  PLAN_ANESTESICO,
} from "@/lib/escalasAnestesia";

export type ValoracionInicial = {
  habitacion: string;
  servicio: string;
  folio: string;
  tipoPago: string;
  fechaIngreso: string;
  horaIngreso: string;
  diagnosticoPrequirurgico: string;
  cirugiaPlaneada: string;
  cirujano: string;
  anestesiologo: string;
  tipoCirugia: string[];
  antecedentesImportancia: string;
  pesoKg: string;
  tallaCm: string;
  temperatura: string;
  ta: string;
  fr: string;
  fc: string;
  spo2: string;
  exploracion: Record<string, string>;
  labFecha: string;
  grupoSanguineo: string;
  factorRh: string;
  laboratorio: Record<string, string>;
  labOtros: string;
  ecg: string;
  rayosX: string;
  ultrasonido: string;
  gabineteOtros: string;
  factoresRiesgo: string[];
  factoresRiesgoEspecificar: string;
  asa: string;
  anginaCanadiense: string;
  goldman: string[];
  predMenores: string[];
  predIntermedios: string[];
  predMayores: string[];
  trombMenores: string[];
  trombIntermedios: string[];
  trombMayores: string[];
  pupilas: string[];
  glasgowOjos: string;
  glasgowMotor: string;
  glasgowVerbal: string;
  ventilacionDificil: string[];
  mallampati: string;
  apertura: string;
  tiromentoniana: string;
  subluxacion: string;
  extension: string;
  planAnestesico: string[];
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
          if (!window.confirm("Al firmar, la valoración preanestésica queda INMUTABLE. ¿Firmar?")) e.preventDefault();
        }}
      >
        Firmar valoración
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

export function ValoracionPreForm({
  qxId,
  editable,
  firmada,
  inicial,
}: {
  qxId: string;
  editable: boolean;
  firmada: boolean;
  inicial: ValoracionInicial;
}) {
  const [state, formAction] = useActionState(
    async (prev: { error?: string; ok?: boolean }, fd: FormData) =>
      guardarValoracionPre(qxId, fd.get("_accion") === "firmar", prev, fd),
    {},
  );
  const ro = editable ? {} : { readOnly: true, disabled: true };

  return (
    <Card>
      <CardHeader
        title="Valoración preanestésica"
        subtitle="Hojas oficiales 15 y 16: datos, exploración, laboratorio, gabinete y factores de riesgo."
        action={firmada ? <Badge tone="green">Firmada — inmutable</Badge> : <Badge tone="amber">Borrador</Badge>}
      />
      <CardBody>
        <form action={formAction} className="space-y-4">
          <ErrorMsg>{state.error}</ErrorMsg>
          {state.ok && <OkMsg>Guardado.</OkMsg>}

          <Bloque titulo="Identificación y programación">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Habitación">
                <Input name="habitacion" defaultValue={inicial.habitacion} {...ro} />
              </Field>
              <Field label="Servicio">
                <Input name="servicio" defaultValue={inicial.servicio} {...ro} />
              </Field>
              <Field label="Folio">
                <Input name="folio" defaultValue={inicial.folio} {...ro} />
              </Field>
              <Field label="Fecha de ingreso">
                <Input name="fechaIngreso" type="date" defaultValue={inicial.fechaIngreso} {...ro} />
              </Field>
              <Field label="Hora de ingreso">
                <Input name="horaIngreso" type="time" defaultValue={inicial.horaIngreso} {...ro} />
              </Field>
              <div>
                <GrupoRadio name="tipoPago" label="Tipo de pago" opciones={TIPO_PAGO} valor={inicial.tipoPago} editable={editable} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Diagnóstico prequirúrgico" required>
                <Input name="diagnosticoPrequirurgico" defaultValue={inicial.diagnosticoPrequirurgico} {...ro} />
              </Field>
              <Field label="Cirugía planeada" required>
                <Input name="cirugiaPlaneada" defaultValue={inicial.cirugiaPlaneada} {...ro} />
              </Field>
              <Field label="Cirujano">
                <Input name="cirujano" defaultValue={inicial.cirujano} {...ro} />
              </Field>
              <Field label="Anestesiólogo">
                <Input name="anestesiologo" defaultValue={inicial.anestesiologo} {...ro} />
              </Field>
            </div>
            <GrupoCheck
              name="tipoCirugia"
              label="Tipo de cirugía"
              opciones={TIPO_CIRUGIA}
              valores={inicial.tipoCirugia}
              editable={editable}
              columnas={3}
            />
            <Field label="Antecedentes de importancia para el procedimiento quirúrgico">
              <Textarea name="antecedentesImportancia" rows={3} defaultValue={inicial.antecedentesImportancia} {...ro} />
            </Field>
          </Bloque>

          <Bloque titulo="Exploración física y signos vitales">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Peso (kg)">
                <Input name="pesoKg" type="number" step="0.1" defaultValue={inicial.pesoKg} {...ro} />
              </Field>
              <Field label="Talla (cm)">
                <Input name="tallaCm" type="number" step="0.1" defaultValue={inicial.tallaCm} {...ro} />
              </Field>
              <Field label="Temperatura (°C)">
                <Input name="temperatura" type="number" step="0.1" defaultValue={inicial.temperatura} {...ro} />
              </Field>
              <Field label="Tensión arterial">
                <Input name="ta" placeholder="120/80" defaultValue={inicial.ta} {...ro} />
              </Field>
              <Field label="Frecuencia respiratoria">
                <Input name="fr" type="number" defaultValue={inicial.fr} {...ro} />
              </Field>
              <Field label="Frecuencia cardíaca">
                <Input name="fc" type="number" defaultValue={inicial.fc} {...ro} />
              </Field>
              <Field label="Saturación de O2 (%)">
                <Input name="spo2" type="number" defaultValue={inicial.spo2} {...ro} />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EXPLORACION_SEGMENTOS.map((s) => (
                <Field key={s.campo} label={s.etiqueta}>
                  <Input name={s.campo} defaultValue={inicial.exploracion[s.campo] ?? ""} {...ro} />
                </Field>
              ))}
            </div>
          </Bloque>

          <Bloque titulo="Laboratorio y gabinete">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Fecha de realización">
                <Input name="labFecha" type="date" defaultValue={inicial.labFecha} {...ro} />
              </Field>
              <Field label="Grupo sanguíneo">
                <Input name="grupoSanguineo" defaultValue={inicial.grupoSanguineo} {...ro} />
              </Field>
              <Field label="Factor Rh">
                <Input name="factorRh" defaultValue={inicial.factorRh} {...ro} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
              {LABORATORIO_CAMPOS.map((l) => (
                <Field key={l.campo} label={l.etiqueta}>
                  <Input name={l.campo} defaultValue={inicial.laboratorio[l.campo] ?? ""} {...ro} />
                </Field>
              ))}
            </div>
            <Field label="Otros / especificar">
              <Input name="labOtros" defaultValue={inicial.labOtros} {...ro} />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Electrocardiograma">
                <Input name="ecg" defaultValue={inicial.ecg} {...ro} />
              </Field>
              <Field label="Rayos X">
                <Input name="rayosX" defaultValue={inicial.rayosX} {...ro} />
              </Field>
              <Field label="Ultrasonido">
                <Input name="ultrasonido" defaultValue={inicial.ultrasonido} {...ro} />
              </Field>
              <Field label="Otros estudios (especificar)">
                <Input name="gabineteOtros" defaultValue={inicial.gabineteOtros} {...ro} />
              </Field>
            </div>
          </Bloque>

          <Bloque titulo="Factores de riesgo">
            <GrupoCheck
              name="factoresRiesgo"
              opciones={FACTORES_RIESGO}
              valores={inicial.factoresRiesgo}
              editable={editable}
              columnas={3}
            />
            <Field label="Especificar">
              <Input name="factoresRiesgoEspecificar" defaultValue={inicial.factoresRiesgoEspecificar} {...ro} />
            </Field>
          </Bloque>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Bloque titulo="Clasificación de ASA">
              <GrupoRadio name="asa" opciones={ASA} valor={inicial.asa} editable={editable} />
            </Bloque>
            <Bloque titulo="Angina — Sociedad Cardiovascular Canadiense">
              <GrupoRadio
                name="anginaCanadiense"
                opciones={ANGINA_CANADIENSE}
                valor={inicial.anginaCanadiense}
                editable={editable}
              />
            </Bloque>
            <Bloque titulo="Clasificación de Goldman">
              <GrupoCheck name="goldman" opciones={GOLDMAN} valores={inicial.goldman} editable={editable} />
              <p className="text-xs text-slate-500">
                El puntaje y la clase (I a IV) se calculan al imprimir la hoja.
              </p>
            </Bloque>
            <Bloque titulo="Riesgo trombolítico">
              <GrupoCheck
                name="trombMenores"
                label="Factores menores (1 punto)"
                opciones={TROMBOLITICO.menores}
                valores={inicial.trombMenores}
                editable={editable}
              />
              <GrupoCheck
                name="trombIntermedios"
                label="Factores intermedios (5 puntos)"
                opciones={TROMBOLITICO.intermedios}
                valores={inicial.trombIntermedios}
                editable={editable}
              />
              <GrupoCheck
                name="trombMayores"
                label="Factores mayores (15 puntos)"
                opciones={TROMBOLITICO.mayores}
                valores={inicial.trombMayores}
                editable={editable}
              />
            </Bloque>
            <Bloque titulo="Predictores de enfermedad arterial coronaria">
              <GrupoCheck
                name="predMenores"
                label="Menores"
                opciones={PREDICTORES_EAC.menores}
                valores={inicial.predMenores}
                editable={editable}
              />
              <GrupoCheck
                name="predIntermedios"
                label="Intermedios"
                opciones={PREDICTORES_EAC.intermedios}
                valores={inicial.predIntermedios}
                editable={editable}
              />
              <GrupoCheck
                name="predMayores"
                label="Mayores"
                opciones={PREDICTORES_EAC.mayores}
                valores={inicial.predMayores}
                editable={editable}
              />
            </Bloque>
            <Bloque titulo="Valoración neurológica">
              <GrupoCheck name="pupilas" label="Pupilas" opciones={PUPILAS} valores={inicial.pupilas} editable={editable} columnas={2} />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Glasgow — ojos">
                  <select
                    name="glasgowOjos"
                    defaultValue={inicial.glasgowOjos}
                    disabled={!editable}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
                  >
                    <option value="">—</option>
                    {GLASGOW.ojos.map((o) => (
                      <option key={o.puntos} value={o.puntos}>
                        {o.puntos} · {o.texto}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Glasgow — motor">
                  <select
                    name="glasgowMotor"
                    defaultValue={inicial.glasgowMotor}
                    disabled={!editable}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
                  >
                    <option value="">—</option>
                    {GLASGOW.motor.map((o) => (
                      <option key={o.puntos} value={o.puntos}>
                        {o.puntos} · {o.texto}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Glasgow — verbal">
                  <select
                    name="glasgowVerbal"
                    defaultValue={inicial.glasgowVerbal}
                    disabled={!editable}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base"
                  >
                    <option value="">—</option>
                    {GLASGOW.verbal.map((o) => (
                      <option key={o.puntos} value={o.puntos}>
                        {o.puntos} · {o.texto}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </Bloque>
            <Bloque titulo="Vía aérea difícil">
              <GrupoCheck
                name="ventilacionDificil"
                label="Predicción de ventilación difícil"
                opciones={VENTILACION_DIFICIL}
                valores={inicial.ventilacionDificil}
                editable={editable}
              />
              <GrupoRadio name="mallampati" label="Mallampati" opciones={MALLAMPATI} valor={inicial.mallampati} editable={editable} columnas={2} />
              <GrupoRadio name="apertura" label="Apertura bucal" opciones={APERTURA_BUCAL} valor={inicial.apertura} editable={editable} />
              <GrupoRadio
                name="tiromentoniana"
                label="Distancia tiromentoniana"
                opciones={DISTANCIA_TIROMENTONIANA}
                valor={inicial.tiromentoniana}
                editable={editable}
              />
              <GrupoRadio
                name="subluxacion"
                label="Subluxación mandibular"
                opciones={SUBLUXACION_MANDIBULAR}
                valor={inicial.subluxacion}
                editable={editable}
              />
              <GrupoRadio
                name="extension"
                label="Extensión de la cabeza"
                opciones={EXTENSION_CABEZA}
                valor={inicial.extension}
                editable={editable}
                columnas={3}
              />
            </Bloque>
          </div>

          <Bloque titulo="Plan anestésico y firma">
            <GrupoCheck
              name="planAnestesico"
              opciones={PLAN_ANESTESICO}
              valores={inicial.planAnestesico}
              editable={editable}
              columnas={3}
            />
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
