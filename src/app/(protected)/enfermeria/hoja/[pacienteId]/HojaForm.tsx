"use client";

import { useActionState } from "react";
import { guardarBorradorHoja, cerrarHoja } from "@/actions/enfermeria";
import { Card, CardBody, CardHeader, Field, Input, Textarea, ErrorMsg, OkMsg, Button } from "@/components/ui";
import { useFormStatus } from "react-dom";

type Inicial = Record<string, string>;

function Botones({ soloLectura }: { soloLectura: boolean }) {
  const { pending } = useFormStatus();
  if (soloLectura) return null;
  return (
    <div className="sticky bottom-4 flex justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
      <Button type="submit" name="_accion" value="borrador" variant="secondary" disabled={pending}>
        {pending ? "Guardando…" : "Guardar borrador"}
      </Button>
      <Button
        type="submit"
        name="_accion"
        value="cerrar"
        disabled={pending}
        onClick={(e) => {
          if (!window.confirm("Al cerrar, la hoja queda inmutable y el paciente se pone DISPONIBLE PARA CONSULTA. ¿Continuar?")) {
            e.preventDefault();
          }
        }}
      >
        {pending ? "Procesando…" : "Guardar y poner disponible"}
      </Button>
    </div>
  );
}

export function HojaForm({
  pacienteId,
  sexo,
  soloLectura,
  inicial = {},
}: {
  pacienteId: string;
  sexo: string;
  soloLectura: boolean;
  inicial?: Inicial;
}) {
  const [state, formAction] = useActionState(
    async (prev: { error?: string; ok?: boolean }, fd: FormData) => {
      const accion = fd.get("_accion");
      if (accion === "cerrar") return cerrarHoja(pacienteId, prev, fd);
      return guardarBorradorHoja(pacienteId, prev, fd);
    },
    {},
  );
  const ro = soloLectura ? { readOnly: true, disabled: true } : {};

  return (
    <form action={formAction} className="space-y-5">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Borrador guardado.</OkMsg>}

      <Card>
        <CardHeader title="F. Padecimiento actual" subtitle="Motivo de consulta y descripción (inicio, evolución, síntomas)." />
        <CardBody className="space-y-4">
          <Field label="Motivo de consulta" required>
            <Input name="motivoConsulta" defaultValue={inicial.motivoConsulta} {...ro} />
          </Field>
          <Field label="Descripción del padecimiento actual">
            <Textarea name="padecimientoActual" rows={3} defaultValue={inicial.padecimientoActual} {...ro} />
          </Field>
          <Field label="Especialidad(es) sugerida(s)" hint="Ayuda a los doctores a filtrar; no asigna.">
            <Input name="especialidadesSugeridas" placeholder="Ej. Traumatología, Cardiología" defaultValue={inicial.especialidadesSugeridas} {...ro} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="B–D. Antecedentes" />
        <CardBody className="space-y-4">
          <Field label="Heredofamiliares" hint="Diabetes, hipertensión, cardiopatías, cáncer, trombosis… y parentesco.">
            <Textarea name="antecedentesHeredofamiliares" rows={3} defaultValue={inicial.antecedentesHeredofamiliares} {...ro} />
          </Field>
          <Field label="Personales patológicos" hint="Crónicos (año y tratamiento), quirúrgicos, traumáticos, transfusionales, hospitalizaciones, tabaquismo, alcoholismo, toxicomanías.">
            <Textarea name="antecedentesPatologicos" rows={3} defaultValue={inicial.antecedentesPatologicos} {...ro} />
          </Field>
          <Field label="Personales no patológicos" hint="Alimentación, actividad física, higiene, vivienda, inmunizaciones.">
            <Textarea name="antecedentesNoPatologicos" rows={2} defaultValue={inicial.antecedentesNoPatologicos} {...ro} />
          </Field>
          {sexo === "F" && (
            <Field label="Gineco-obstétricos" hint="Menarca, ritmo, G/P/C/A, FUM, MPF, lactancia, último Papanicolaou/mastografía.">
              <Textarea name="antecedentesGinecoObstetricos" rows={2} defaultValue={inicial.antecedentesGinecoObstetricos} {...ro} />
            </Field>
          )}
          <div className="rounded-lg border-2 border-red-300 bg-red-50 p-3">
            <Field label="ALERGIAS" required hint="Si no hay alergias conocidas, escriba «NINGUNA CONOCIDA».">
              <Input name="alergias" className="border-red-300 bg-white" defaultValue={inicial.alergias} {...ro} />
            </Field>
          </div>
          <Field label="Medicamentos actuales">
            <Textarea name="medicamentosActuales" rows={2} defaultValue={inicial.medicamentosActuales} {...ro} />
          </Field>
          <Field label="Interrogatorio por aparatos y sistemas" hint="Cardiovascular, respiratorio, gastrointestinal, hemático/linfático, nervioso, musculoesquelético, piel y tegumentos.">
            <Textarea name="interrogatorioAparatos" rows={3} defaultValue={inicial.interrogatorioAparatos} {...ro} />
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Cirugía estética (si aplica)" subtitle="Campos de la nota de contacto inicial." />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Cirugía deseada"><Input name="cirugiaDeseada" defaultValue={inicial.cirugiaDeseada} {...ro} /></Field>
          <Field label="Presupuesto"><Input name="presupuesto" defaultValue={inicial.presupuesto} {...ro} /></Field>
          <Field label="Fecha programada deseada"><Input name="fechaProgramadaDeseada" defaultValue={inicial.fechaProgramadaDeseada} {...ro} /></Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="G. Signos vitales y somatometría" subtitle="Obligatorios para poner disponible. Rangos plausibles con advertencia." />
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="TA sistólica (mmHg)" required><Input name="taSistolica" type="number" min={40} max={300} defaultValue={inicial.taSistolica} {...ro} /></Field>
          <Field label="TA diastólica (mmHg)" required><Input name="taDiastolica" type="number" min={20} max={200} defaultValue={inicial.taDiastolica} {...ro} /></Field>
          <Field label="FC (lpm)" required><Input name="fc" type="number" min={20} max={300} defaultValue={inicial.fc} {...ro} /></Field>
          <Field label="FR (rpm)" required><Input name="fr" type="number" min={4} max={80} defaultValue={inicial.fr} {...ro} /></Field>
          <Field label="Temperatura (°C)" required><Input name="temperatura" type="number" step="0.1" min={30} max={45} defaultValue={inicial.temperatura} {...ro} /></Field>
          <Field label="SpO2 (%)"><Input name="spo2" type="number" min={40} max={100} defaultValue={inicial.spo2} {...ro} /></Field>
          <Field label="Peso (kg)" required><Input name="pesoKg" type="number" step="0.1" min={0.5} max={400} defaultValue={inicial.pesoKg} {...ro} /></Field>
          <Field label="Talla (cm)" required><Input name="tallaCm" type="number" step="0.1" min={30} max={250} defaultValue={inicial.tallaCm} {...ro} /></Field>
          <Field label="Glucosa capilar (mg/dL)"><Input name="glucosa" type="number" min={20} max={800} defaultValue={inicial.glucosa} {...ro} /></Field>
          <Field label="Escala de dolor (0–10)"><Input name="escalaDolor" type="number" min={0} max={10} defaultValue={inicial.escalaDolor} {...ro} /></Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Observaciones de enfermería" />
        <CardBody>
          <Textarea name="observacionesEnfermeria" rows={2} defaultValue={inicial.observacionesEnfermeria} {...ro} />
        </CardBody>
      </Card>

      <Botones soloLectura={soloLectura} />
    </form>
  );
}
