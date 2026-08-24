"use client";

import { useActionState } from "react";
import { activarCuentaPaciente } from "@/actions/invitaciones";
import { Field, Input, ErrorMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function ActivarForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(activarCuentaPaciente, {});
  return (
    <form action={formAction} className="space-y-4">
      <ErrorMsg>{state.error}</ErrorMsg>
      <input type="hidden" name="token" value={token} />
      <Field label="Contraseña" required hint="Mínimo 10 caracteres, con mayúscula, minúscula y número.">
        <Input name="password" type="password" autoComplete="new-password" required minLength={10} />
      </Field>
      <Field label="Confirmar contraseña" required>
        <Input name="passwordConfirma" type="password" autoComplete="new-password" required minLength={10} />
      </Field>
      <SubmitButton className="w-full">Activar mi cuenta</SubmitButton>
    </form>
  );
}
