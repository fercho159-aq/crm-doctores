"use client";

import { useActionState, useRef } from "react";
import { actualizarPerfilDoctor, guardarFirmaPropia } from "@/actions/doctor";
import { Field, Input, ErrorMsg, OkMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

type Doctor = {
  cedulaProfesional: string;
  cedulaEspecialidad: string | null;
  institucionTitulo: string;
  universidadEspecialidad: string | null;
  consultorio: string | null;
  domicilioConsultorio: string | null;
  telefono: string | null;
};

export function PerfilDoctorForm({ doctor }: { doctor: Doctor }) {
  const [state, formAction] = useActionState(actualizarPerfilDoctor, {});
  return (
    <form action={formAction} className="space-y-3">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Perfil actualizado.</OkMsg>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Cédula profesional" required>
          <Input name="cedulaProfesional" defaultValue={doctor.cedulaProfesional} required />
        </Field>
        <Field label="Cédula de especialidad">
          <Input name="cedulaEspecialidad" defaultValue={doctor.cedulaEspecialidad ?? ""} />
        </Field>
      </div>
      <Field label="Institución que expidió el título" required hint="Aparece en la receta (RIS art. 28).">
        <Input name="institucionTitulo" defaultValue={doctor.institucionTitulo} required />
      </Field>
      <Field label="Universidad de la especialidad">
        <Input name="universidadEspecialidad" defaultValue={doctor.universidadEspecialidad ?? ""} />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Consultorio">
          <Input name="consultorio" defaultValue={doctor.consultorio ?? ""} placeholder="Nombre o número de consultorio" />
        </Field>
        <Field label="Teléfono">
          <Input name="telefono" type="tel" defaultValue={doctor.telefono ?? ""} />
        </Field>
      </div>
      <Field
        label="Domicilio del consultorio"
        hint="Obligatorio antes de emitir recetas (RIS art. 28) si no pertenece a una clínica con dirección propia."
      >
        <Input name="domicilioConsultorio" defaultValue={doctor.domicilioConsultorio ?? ""} placeholder="Calle, número, colonia, CP, ciudad" />
      </Field>
      <SubmitButton>Guardar perfil</SubmitButton>
    </form>
  );
}

export function FirmaPropiaForm({ firmaActual }: { firmaActual: string | null }) {
  const [state, formAction] = useActionState(guardarFirmaPropia, {});
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
    <div className="space-y-2">
      {firmaActual && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={firmaActual} alt="Firma digitalizada actual" className="h-16 rounded border border-slate-200 bg-white p-1" />
      )}
      <form ref={formRef} action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="firma" ref={hiddenRef} />
        <label className="cursor-pointer text-sm text-blue-700 underline">
          {firmaActual ? "Cambiar firma digitalizada" : "Cargar firma digitalizada"} (PNG/JPG, fondo claro)
          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <ErrorMsg>{state.error}</ErrorMsg>
        {state.ok && <span className="text-xs text-emerald-700">Firma guardada ✓</span>}
      </form>
    </div>
  );
}
