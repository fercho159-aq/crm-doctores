"use client";

import { useActionState } from "react";
import { guardarConfiguracion } from "@/actions/admin";
import { Field, Input, ErrorMsg, OkMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function ConfigForm({ inicial }: { inicial: Record<string, string> }) {
  const [state, formAction] = useActionState(guardarConfiguracion, {});
  return (
    <form action={formAction} className="space-y-4">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Configuración guardada.</OkMsg>}
      <Field label="Razón social" required>
        <Input name="razonSocial" defaultValue={inicial.razonSocial} required />
      </Field>
      <Field label="Domicilio del establecimiento" required>
        <Input name="domicilio" defaultValue={inicial.domicilio} required />
      </Field>
      <Field label="Teléfono" required>
        <Input name="telefono" defaultValue={inicial.telefono} required />
      </Field>
      <Field label="Correo remitente de recetas" required hint="Con dominio verificado en Resend (SPF/DKIM/DMARC) para no caer en spam.">
        <Input name="emailRemitente" type="email" defaultValue={inicial.emailRemitente} required />
      </Field>
      <SubmitButton>Guardar configuración</SubmitButton>
    </form>
  );
}
