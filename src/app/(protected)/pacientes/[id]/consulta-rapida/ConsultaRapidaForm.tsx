"use client";

import { useActionState, useState } from "react";
import { emitirConsultaRapida } from "@/actions/consulta-rapida";
import { Card, CardBody, CardHeader, Field, Input, Select, ErrorMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

interface Partida {
  medicamento: string;
  dosis: string;
  viaAdministracion: string;
  frecuencia: string;
  duracion: string;
}

const VIAS = ["Oral", "IV", "IM", "SC", "Sublingual", "Rectal", "Tópica", "Inhalada", "Oftálmica", "Ótica"];

export function ConsultaRapidaForm({ asignacionId }: { asignacionId: string }) {
  const bound = emitirConsultaRapida.bind(null, asignacionId);
  const [state, formAction] = useActionState(bound, {});
  const [partidas, setPartidas] = useState<Partida[]>([
    { medicamento: "", dosis: "", viaAdministracion: "Oral", frecuencia: "", duracion: "" },
  ]);

  const addPartida = () =>
    setPartidas([...partidas, { medicamento: "", dosis: "", viaAdministracion: "Oral", frecuencia: "", duracion: "" }]);

  const removePartida = (i: number) => setPartidas(partidas.filter((_, j) => j !== i));

  const updatePartida = (i: number, field: keyof Partida, value: string) => {
    const copy = [...partidas];
    copy[i] = { ...copy[i], [field]: value };
    setPartidas(copy);
  };

  return (
    <form
      action={(fd) => {
        fd.set("partidas", JSON.stringify(partidas));
        formAction(fd);
      }}
      className="space-y-6"
    >
      <ErrorMsg>{state.error}</ErrorMsg>

      {/* 1. Signos vitales */}
      <Card>
        <CardHeader title="1. Signos vitales" subtitle="Mediciones del paciente en esta consulta" />
        <CardBody className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Peso (kg)"><Input name="pesoKg" type="number" step="0.1" placeholder="70.5" /></Field>
          <Field label="Talla (cm)"><Input name="tallaCm" type="number" step="0.1" placeholder="170" /></Field>
          <Field label="TA sistólica"><Input name="taSistolica" type="number" placeholder="120" /></Field>
          <Field label="TA diastólica"><Input name="taDiastolica" type="number" placeholder="80" /></Field>
          <Field label="FC (lpm)"><Input name="fc" type="number" placeholder="72" /></Field>
          <Field label="Temp (°C)"><Input name="temperatura" type="number" step="0.1" placeholder="36.5" /></Field>
          <Field label="SpO2 (%)"><Input name="spo2" type="number" placeholder="98" /></Field>
          <Field label="Glucosa (mg/dL)"><Input name="glucosa" type="number" placeholder="90" /></Field>
        </CardBody>
      </Card>

      {/* 2. Diagnóstico */}
      <Card>
        <CardHeader title="2. Diagnóstico" />
        <CardBody>
          <Field label="Diagnóstico" required>
            <textarea
              name="diagnostico"
              required
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ej. Faringitis aguda, Gastroenteritis infecciosa..."
            />
          </Field>
        </CardBody>
      </Card>

      {/* 3. Medicamentos */}
      <Card>
        <CardHeader title="3. Medicamentos" subtitle="Agregue los medicamentos de la receta" />
        <CardBody className="space-y-4">
          {partidas.map((p, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Medicamento {i + 1}</span>
                {partidas.length > 1 && (
                  <button type="button" onClick={() => removePartida(i)} className="text-xs text-red-500 hover:text-red-700">
                    Quitar
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Medicamento" required>
                  <Input value={p.medicamento} onChange={(e) => updatePartida(i, "medicamento", e.target.value)} placeholder="Amoxicilina" required />
                </Field>
                <Field label="Dosis" required>
                  <Input value={p.dosis} onChange={(e) => updatePartida(i, "dosis", e.target.value)} placeholder="500 mg" required />
                </Field>
                <Field label="Vía" required>
                  <Select value={p.viaAdministracion} onChange={(e) => updatePartida(i, "viaAdministracion", e.target.value)}>
                    {VIAS.map((v) => <option key={v} value={v}>{v}</option>)}
                  </Select>
                </Field>
                <Field label="Frecuencia" required>
                  <Input value={p.frecuencia} onChange={(e) => updatePartida(i, "frecuencia", e.target.value)} placeholder="Cada 8 horas" required />
                </Field>
                <Field label="Duración" required>
                  <Input value={p.duracion} onChange={(e) => updatePartida(i, "duracion", e.target.value)} placeholder="7 días" required />
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={addPartida}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-500 transition hover:border-blue-400 hover:text-blue-600"
          >
            + Agregar otro medicamento
          </button>
        </CardBody>
      </Card>

      {/* 4. Estudios (opcional) */}
      <Card>
        <CardHeader title="4. Estudios solicitados (opcional)" subtitle="Laboratorios, rayos X, ultrasonido, etc." />
        <CardBody>
          <textarea
            name="estudios"
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            placeholder="Ej. Biometría hemática, Química sanguínea, Rx de tórax..."
          />
        </CardBody>
      </Card>

      {/* 5. Indicaciones y próxima cita */}
      <Card>
        <CardHeader title="5. Indicaciones generales" />
        <CardBody className="space-y-4">
          <Field label="Indicaciones para el paciente">
            <textarea
              name="indicacionesGenerales"
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Reposo, dieta blanda, abundantes líquidos..."
            />
          </Field>
          <Field label="Próxima cita">
            <Input name="proximaCita" placeholder="En 7 días, o si persisten los síntomas" />
          </Field>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <SubmitButton className="bg-blue-700 px-8 text-white hover:bg-blue-800">
          Emitir receta
        </SubmitButton>
      </div>
    </form>
  );
}
