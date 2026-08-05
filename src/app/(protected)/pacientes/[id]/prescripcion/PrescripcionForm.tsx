"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { guardarPrescripcion } from "@/actions/hojasMedicas";
import { Card, CardHeader, CardBody, Field, Input, ErrorMsg, OkMsg, Button, Badge } from "@/components/ui";
import { FilasDinamicas } from "@/components/FilasDinamicas";

const VIAS = ["Oral", "IV", "IM", "SC", "Sublingual", "Rectal", "Tópica", "Inhalada", "Oftálmica", "Ótica"];

function Botones() {
  const { pending } = useFormStatus();
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
          if (!window.confirm("Al firmar, la prescripción queda INMUTABLE (NOM-004). ¿Firmar?")) e.preventDefault();
        }}
      >
        Firmar prescripción
      </Button>
    </div>
  );
}

export function PrescripcionForm({
  pacienteId,
  editable,
  firmada,
  hojaId,
  inicial,
  partidas,
}: {
  pacienteId: string;
  editable: boolean;
  firmada: boolean;
  hojaId?: string;
  inicial: { cuarto: string; diagnostico: string; dieta: string };
  partidas: Record<string, string>[];
}) {
  const [state, formAction] = useActionState(
    async (prev: { error?: string; ok?: boolean }, fd: FormData) =>
      guardarPrescripcion(pacienteId, fd.get("_accion") === "firmar", prev, fd),
    {},
  );
  const ro = editable ? {} : { readOnly: true, disabled: true };

  return (
    <Card>
      <CardHeader
        title="Prescripción médica de medicamentos"
        subtitle="Hoja de indicaciones farmacológicas: medicamento, dosis, vía y horario."
        action={firmada ? <Badge tone="green">Firmada — inmutable</Badge> : <Badge tone="amber">Borrador</Badge>}
      />
      <CardBody>
        <form action={formAction} className="space-y-4">
          <ErrorMsg>{state.error}</ErrorMsg>
          {state.ok && <OkMsg>Guardado.</OkMsg>}
          {hojaId && <input type="hidden" name="hojaId" value={hojaId} />}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Cuarto">
              <Input name="cuarto" defaultValue={inicial.cuarto} {...ro} />
            </Field>
            <Field label="Diagnóstico">
              <Input name="diagnostico" defaultValue={inicial.diagnostico} {...ro} />
            </Field>
            <Field label="Dieta">
              <Input name="dieta" defaultValue={inicial.dieta} placeholder="Blanda, fraccionada…" {...ro} />
            </Field>
          </div>

          <FilasDinamicas
            editable={editable}
            inicial={partidas}
            etiquetaAgregar="Agregar medicamento"
            columnas={[
              { name: "p_fecha", label: "Fecha", type: "date", ancho: "w-36" },
              { name: "p_medicamento", label: "Medicamento", placeholder: "Denominación genérica y presentación" },
              { name: "p_dosis", label: "Dosis", ancho: "w-28", placeholder: "1 g" },
              { name: "p_via", label: "Vía", ancho: "w-32", opciones: VIAS },
              { name: "p_horario", label: "Horario", ancho: "w-36", placeholder: "c/12 h" },
            ]}
          />

          {editable && <Botones />}
        </form>
      </CardBody>
    </Card>
  );
}
