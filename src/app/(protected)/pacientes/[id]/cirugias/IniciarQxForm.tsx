"use client";

import { useActionState } from "react";
import { iniciarExpedienteQx } from "@/actions/quirurgico";
import { Card, CardHeader, CardBody, Field, Input, ErrorMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function IniciarQxForm({ asignacionId }: { asignacionId: string }) {
  const [state, formAction] = useActionState(iniciarExpedienteQx.bind(null, asignacionId), {});
  return (
    <Card className="border-blue-200">
      <CardHeader title="Iniciar expediente quirúrgico" />
      <CardBody>
        <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ErrorMsg>{state.error}</ErrorMsg>
          <Field label="Fecha de cirugía programada">
            <Input name="fechaCirugiaProgramada" type="datetime-local" />
          </Field>
          <Field label="Quirófano / sede">
            <Input name="quirofanoSede" placeholder="Quirófano 1, MIT" />
          </Field>
          <div className="flex items-end">
            <SubmitButton>Crear expediente</SubmitButton>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
