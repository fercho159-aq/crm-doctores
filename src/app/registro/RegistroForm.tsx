"use client";

import { useActionState } from "react";
import { registrarDoctorBasic } from "@/actions/registro";
import { Field, Input, ErrorMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function RegistroForm() {
  const [state, formAction] = useActionState(registrarDoctorBasic, {});
  return (
    <form action={formAction} className="space-y-4">
      <ErrorMsg>{state.error}</ErrorMsg>

      {/* Honeypot: invisible para personas, los bots que rellenan todo lo detonan. */}
      <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="sitioWeb">Sitio web</label>
        <input id="sitioWeb" name="sitioWeb" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <Field label="Nombre completo" required>
        <Input name="nombreCompleto" required placeholder="Dr(a). Nombre Apellido" />
      </Field>
      <Field label="Correo electrónico" required hint="Será su usuario para iniciar sesión.">
        <Input name="email" type="email" autoComplete="username" required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Contraseña" required hint="Mínimo 10 caracteres, con mayúscula, minúscula y número.">
          <Input name="password" type="password" autoComplete="new-password" required minLength={10} />
        </Field>
        <Field label="Confirmar contraseña" required>
          <Input name="passwordConfirma" type="password" autoComplete="new-password" required minLength={10} />
        </Field>
      </div>

      <Field label="Especialidad" required hint="Ej. Medicina General, Dermatología, Nutrición Clínica…">
        <Input name="especialidad" required placeholder="¿Qué tipo de consulta ofrece?" />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Cédula profesional" required hint="Obligatoria por ley para emitir recetas.">
          <Input name="cedulaProfesional" required />
        </Field>
        <Field label="Cédula de especialidad">
          <Input name="cedulaEspecialidad" />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Institución del título" required hint="Aparece impresa en la receta.">
          <Input name="institucionTitulo" required />
        </Field>
        <Field label="Universidad (especialidad)">
          <Input name="universidadEspecialidad" />
        </Field>
      </div>
      <Field label="Teléfono">
        <Input name="telefono" type="tel" />
      </Field>
      <Field
        label="Domicilio del consultorio"
        hint="Obligatorio antes de emitir su primera receta (RIS art. 28). Puede completarlo ahora o después en Mi perfil."
      >
        <Input name="domicilioConsultorio" placeholder="Calle, número, colonia, CP, ciudad" />
      </Field>

      <SubmitButton className="w-full">Crear mi cuenta</SubmitButton>
    </form>
  );
}
