"use client";

import { useActionState } from "react";
import { crearEspecialidad } from "@/actions/admin";
import { Field, Input, ErrorMsg, OkMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function NuevaEspecialidadForm() {
  const [state, formAction] = useActionState(crearEspecialidad, {});
  return (
    <form action={formAction} className="space-y-3">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Especialidad creada.</OkMsg>}
      <Field label="Nombre" required>
        <Input name="nombre" required />
      </Field>
      <Field label="Descripción">
        <Input name="descripcion" />
      </Field>
      <SubmitButton className="w-full">Crear</SubmitButton>
    </form>
  );
}
