"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button, ErrorMsg, OkMsg } from "./ui";
import type { ActionState } from "@/actions/auth";

export function SubmitButton({
  children,
  variant = "primary",
  confirm,
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  confirm?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? "Procesando…" : children}
    </Button>
  );
}

// Formulario genérico ligado a una Server Action con estado (error/ok).
export function ActionForm({
  action,
  children,
  className,
  okMessage,
}: {
  action: (prev: ActionState, fd: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
  okMessage?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className={className}>
      <div className="space-y-3">
        <ErrorMsg>{state.error}</ErrorMsg>
        {state.ok && okMessage ? <OkMsg>{okMessage}</OkMsg> : null}
        {children}
      </div>
    </form>
  );
}
