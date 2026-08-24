"use client";

import { useActionState } from "react";
import { crearAportacion } from "@/actions/pacientePortal";
import { Field, Select, Textarea, ErrorMsg, OkMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

const CATEGORIAS = [
  { value: "ALERGIA", label: "Alergia" },
  { value: "MEDICAMENTO", label: "Medicamento que estoy tomando" },
  { value: "ANTECEDENTE", label: "Antecedente médico" },
  { value: "SINTOMA", label: "Síntoma actual" },
  { value: "OBSERVACION", label: "Otra observación" },
  { value: "PRECONSULTA", label: "Para mi próxima consulta" },
];

export function AportarForm() {
  const [state, formAction] = useActionState(crearAportacion, {});
  return (
    <form action={formAction} className="space-y-3">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Enviado. Su médico lo revisará en su próxima consulta.</OkMsg>}
      <Field label="Tipo de información">
        <Select name="categoria" defaultValue="OBSERVACION">
          {CATEGORIAS.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </Select>
      </Field>
      <Field label="Descripción" required hint="Esto no modifica su expediente clínico; su médico lo revisará.">
        <Textarea name="contenido" rows={3} required placeholder="Escriba aquí la información que quiere reportar…" />
      </Field>
      <SubmitButton>Enviar a mi médico</SubmitButton>
    </form>
  );
}
