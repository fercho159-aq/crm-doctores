"use client";

import { useActionState, useRef } from "react";
import { crearDoctor, guardarFirmaDoctor } from "@/actions/admin";
import { Field, Input, ErrorMsg, OkMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function NuevoDoctorForm({ especialidades }: { especialidades: { id: string; nombre: string }[] }) {
  const [state, formAction] = useActionState(crearDoctor, {});
  return (
    <form action={formAction} className="space-y-3">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Doctor creado. Entregue la contraseña temporal.</OkMsg>}
      <Field label="Nombre completo (con título)" required>
        <Input name="nombreCompleto" required placeholder="Dr. / Dra. Nombre Apellidos" />
      </Field>
      <Field label="Correo (login)" required>
        <Input name="email" type="email" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Cédula profesional" required>
          <Input name="cedulaProfesional" required />
        </Field>
        <Field label="Cédula de especialidad">
          <Input name="cedulaEspecialidad" />
        </Field>
      </div>
      <Field label="Institución que expidió el título" required hint="Aparece en la receta (RIS art. 28).">
        <Input name="institucionTitulo" required placeholder="UNAM, IPN…" />
      </Field>
      <Field label="Universidad de la especialidad">
        <Input name="universidadEspecialidad" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Consultorio">
          <Input name="consultorio" placeholder="Piso 3, consultorio 302" />
        </Field>
        <Field label="Teléfono">
          <Input name="telefono" type="tel" />
        </Field>
      </div>
      <Field label="Especialidades" required>
        <div className="grid grid-cols-1 gap-1 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
          {especialidades.map((e) => (
            <label key={e.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="especialidadIds" value={e.id} className="h-4 w-4 rounded border-slate-300" />
              {e.nombre}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Contraseña temporal" required hint="Mínimo 10 caracteres.">
        <Input name="passwordTemporal" required />
      </Field>
      <SubmitButton className="w-full">Crear doctor</SubmitButton>
    </form>
  );
}

export function FirmaDoctorForm({ doctorId }: { doctorId: string }) {
  const [state, formAction] = useActionState(guardarFirmaDoctor, {});
  const hiddenRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (hiddenRef.current && typeof reader.result === "string") {
        hiddenRef.current.value = reader.result;
        formRef.current?.requestSubmit();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <form ref={formRef} action={formAction} className="mt-2 flex items-center gap-2">
      <input type="hidden" name="doctorId" value={doctorId} />
      <input type="hidden" name="firma" ref={hiddenRef} />
      <label className="cursor-pointer text-xs text-blue-700 underline">
        Cargar firma digitalizada (PNG/JPG, fondo claro)
        <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <span className="text-xs text-emerald-700">Firma guardada ✓</span>}
    </form>
  );
}
