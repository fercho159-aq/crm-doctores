"use client";

import { useActionState } from "react";
import { loginAction } from "@/actions/auth";
import { Field, Input, ErrorMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, {});
  return (
    <form action={formAction} className="space-y-4">
      <ErrorMsg>{state.error}</ErrorMsg>
      <Field label="Correo electrónico" required>
        <Input name="email" type="email" autoComplete="username" required placeholder="usuario@medicaltower.mx" />
      </Field>
      <Field label="Contraseña" required>
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton className="w-full">Iniciar sesión</SubmitButton>
    </form>
  );
}
