"use client";

import { useActionState } from "react";
import { invitarPacienteAlPortal } from "@/actions/invitaciones";
import { Field, Input, ErrorMsg, OkMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function InvitarPortalForm({ pacienteId, emailSugerido }: { pacienteId: string; emailSugerido: string }) {
  const [state, formAction] = useActionState(invitarPacienteAlPortal.bind(null, pacienteId), {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Invitación enviada.</OkMsg>}
      <Field label="Correo del paciente" required hint="Ahí recibirá el enlace para activar su cuenta.">
        <Input name="email" type="email" defaultValue={emailSugerido} required />
      </Field>
      <SubmitButton>Invitar al portal</SubmitButton>
    </form>
  );
}
