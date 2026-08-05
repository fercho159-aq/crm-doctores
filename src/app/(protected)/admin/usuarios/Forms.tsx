"use client";

import { useActionState, useState } from "react";
import { crearEnfermeria, crearAnestesiologo, resetPassword } from "@/actions/admin";
import { Field, Input, ErrorMsg, OkMsg, Button } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function NuevaEnfermeriaForm() {
  const [state, formAction] = useActionState(crearEnfermeria, {});
  return (
    <form action={formAction} className="space-y-3">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Usuario de enfermería creado.</OkMsg>}
      <Field label="Nombre completo" required>
        <Input name="nombreCompleto" required />
      </Field>
      <Field label="Correo (login)" required>
        <Input name="email" type="email" required />
      </Field>
      <Field label="Contraseña temporal" required hint="Mínimo 10 caracteres; se exige cambio al primer ingreso.">
        <Input name="passwordTemporal" required />
      </Field>
      <SubmitButton className="w-full">Crear usuario</SubmitButton>
    </form>
  );
}

export function NuevaAnestesiologoForm() {
  const [state, formAction] = useActionState(crearAnestesiologo, {});
  return (
    <form action={formAction} className="space-y-3">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Usuario de anestesiología creado. La rúbrica se carga desde Doctores.</OkMsg>}
      <Field label="Nombre completo" required>
        <Input name="nombreCompleto" required placeholder="Dr. / Dra. Nombre Apellidos" />
      </Field>
      <Field label="Correo (login)" required>
        <Input name="email" type="email" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cédula profesional" required hint="Se imprime en las hojas de anestesiología.">
          <Input name="cedulaProfesional" required />
        </Field>
        <Field label="Cédula de especialidad">
          <Input name="cedulaEspecialidad" />
        </Field>
      </div>
      <Field label="Institución que expidió el título" required>
        <Input name="institucionTitulo" required placeholder="UNAM, IPN…" />
      </Field>
      <Field label="Teléfono">
        <Input name="telefono" type="tel" />
      </Field>
      <Field label="Contraseña temporal" required hint="Mínimo 10 caracteres; se exige cambio al primer ingreso.">
        <Input name="passwordTemporal" required />
      </Field>
      <SubmitButton className="w-full">Crear usuario</SubmitButton>
    </form>
  );
}

export function ResetPasswordForm({ usuarioId }: { usuarioId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction] = useActionState(resetPassword, {});
  if (!abierto) {
    return (
      <button type="button" className="mt-1 text-xs text-blue-700 underline" onClick={() => setAbierto(true)}>
        Restablecer contraseña
      </button>
    );
  }
  return (
    <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
      <input type="hidden" name="usuarioId" value={usuarioId} />
      <Input name="passwordTemporal" placeholder="Nueva contraseña temporal" className="w-64" required />
      <Button type="submit" size="sm" variant="secondary">Aplicar</Button>
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <span className="text-xs text-emerald-700">Contraseña restablecida ✓</span>}
    </form>
  );
}
