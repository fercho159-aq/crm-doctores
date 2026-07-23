"use client";

import { useActionState } from "react";
import { cambiarPasswordAction } from "@/actions/auth";
import { Field, Input, ErrorMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function CambiarPasswordForm() {
  const [state, formAction] = useActionState(cambiarPasswordAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <ErrorMsg>{state.error}</ErrorMsg>
      <Field label="Contraseña actual" required>
        <Input name="passwordActual" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Contraseña nueva" required hint="Mínimo 10 caracteres, con mayúscula, minúscula y número.">
        <Input name="passwordNueva" type="password" autoComplete="new-password" required />
      </Field>
      <Field label="Confirmar contraseña nueva" required>
        <Input name="passwordConfirma" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton className="w-full">Guardar y volver a iniciar sesión</SubmitButton>
    </form>
  );
}
