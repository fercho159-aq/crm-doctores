"use client";

import { useActionState, useState } from "react";
import { emitirReceta } from "@/actions/recetas";
import { Card, CardHeader, CardBody, Field, Input, Textarea, Select, ErrorMsg, Button } from "@/components/ui";
import { useFormStatus } from "react-dom";

type Partida = {
  medicamento: string;
  presentacion: string;
  dosis: string;
  viaAdministracion: string;
  frecuencia: string;
  duracion: string;
  cantidad: string;
  indicaciones: string;
};

const VIAS = ["Oral", "Sublingual", "Tópica", "Intramuscular", "Intravenosa", "Subcutánea", "Inhalada", "Oftálmica", "Ótica", "Nasal", "Rectal", "Vaginal"];

const vacia = (): Partida => ({
  medicamento: "", presentacion: "", dosis: "", viaAdministracion: "Oral",
  frecuencia: "", duracion: "", cantidad: "", indicaciones: "",
});

function BotonFirmar({ email }: { email: string | null }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        const msg = email
          ? `La receta se firmará, generará PDF y se enviará automáticamente a ${email}. Esta acción no se puede deshacer (los errores se corrigen cancelando y emitiendo una nueva). ¿Firmar y enviar?`
          : "El paciente NO tiene correo registrado: la receta solo podrá imprimirse o descargarse. ¿Firmar receta?";
        if (!window.confirm(msg)) e.preventDefault();
      }}
    >
      {pending ? "Generando…" : email ? "Firmar y enviar" : "Firmar receta"}
    </Button>
  );
}

export function RecetaForm({ asignacionId, emailPaciente }: { asignacionId: string; emailPaciente: string | null }) {
  const [partidas, setPartidas] = useState<Partida[]>([vacia()]);
  const [state, formAction] = useActionState(emitirReceta.bind(null, asignacionId), {});

  const set = (i: number, campo: keyof Partida, valor: string) => {
    setPartidas((prev) => prev.map((p, idx) => (idx === i ? { ...p, [campo]: valor } : p)));
  };

  return (
    <form action={formAction} className="space-y-4">
      <ErrorMsg>{state.error}</ErrorMsg>
      <input type="hidden" name="partidas" value={JSON.stringify(partidas)} />

      {partidas.map((p, i) => (
        <Card key={i}>
          <CardHeader
            title={`Medicamento ${i + 1}`}
            action={
              partidas.length > 1 ? (
                <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setPartidas((prev) => prev.filter((_, idx) => idx !== i))}>
                  Quitar
                </button>
              ) : undefined
            }
          />
          <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Denominación genérica (y distintiva opcional)" required>
              <Input value={p.medicamento} onChange={(e) => set(i, "medicamento", e.target.value)} placeholder="Paracetamol (Tempra)" required />
            </Field>
            <Field label="Presentación">
              <Input value={p.presentacion} onChange={(e) => set(i, "presentacion", e.target.value)} placeholder="Tabletas 500 mg" />
            </Field>
            <Field label="Dosis" required>
              <Input value={p.dosis} onChange={(e) => set(i, "dosis", e.target.value)} placeholder="1 tableta (500 mg)" required />
            </Field>
            <Field label="Vía de administración" required>
              <Select value={p.viaAdministracion} onChange={(e) => set(i, "viaAdministracion", e.target.value)}>
                {VIAS.map((v) => <option key={v} value={v}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Frecuencia" required>
              <Input value={p.frecuencia} onChange={(e) => set(i, "frecuencia", e.target.value)} placeholder="Cada 8 horas" required />
            </Field>
            <Field label="Duración" required>
              <Input value={p.duracion} onChange={(e) => set(i, "duracion", e.target.value)} placeholder="5 días" required />
            </Field>
            <Field label="Cantidad a surtir">
              <Input value={p.cantidad} onChange={(e) => set(i, "cantidad", e.target.value)} placeholder="1 caja" />
            </Field>
            <Field label="Indicaciones del medicamento">
              <Input value={p.indicaciones} onChange={(e) => set(i, "indicaciones", e.target.value)} placeholder="Tomar con alimentos" />
            </Field>
          </CardBody>
        </Card>
      ))}

      <Button type="button" variant="secondary" onClick={() => setPartidas((prev) => [...prev, vacia()])}>
        + Agregar medicamento
      </Button>

      <Card>
        <CardHeader title="Datos generales" />
        <CardBody className="space-y-3">
          <Field label="Diagnóstico (aparece en la receta a su criterio)">
            <Input name="diagnostico" />
          </Field>
          <Field label="Indicaciones generales">
            <Textarea name="indicacionesGenerales" rows={2} placeholder="Reposo, hidratación, datos de alarma…" />
          </Field>
          <Field label="Próxima cita (opcional)">
            <Input name="proximaCita" placeholder="Ej. 30 de julio de 2026, 10:00" />
          </Field>
        </CardBody>
      </Card>

      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">
          {emailPaciente ? (
            <>Se enviará automáticamente a: <strong>{emailPaciente}</strong></>
          ) : (
            <span className="text-amber-700">Paciente sin correo — solo impresión/descarga. Puede pedir a enfermería registrar el correo.</span>
          )}
        </p>
        <BotonFirmar email={emailPaciente} />
      </div>
    </form>
  );
}
