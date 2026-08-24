"use client";

import { useActionState, useRef } from "react";
import { actualizarPerfilPropio, guardarFotoPropia } from "@/actions/pacientePortal";
import { Field, Input, ErrorMsg, OkMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

type Paciente = {
  telefono: string;
  email: string | null;
  calle: string | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  cp: string | null;
  contactoEmergenciaNombre: string | null;
  contactoEmergenciaTelefono: string | null;
  contactoEmergenciaParentesco: string | null;
  prefNotificacionEmail: boolean;
};

export function PerfilPacienteForm({ paciente }: { paciente: Paciente }) {
  const [state, formAction] = useActionState(actualizarPerfilPropio, {});
  return (
    <form action={formAction} className="space-y-4">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Datos actualizados.</OkMsg>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Teléfono" required>
          <Input name="telefono" type="tel" defaultValue={paciente.telefono} required />
        </Field>
        <Field label="Correo electrónico" hint="A este correo le enviamos sus recetas.">
          <Input name="email" type="email" defaultValue={paciente.email ?? ""} />
        </Field>
      </div>

      <p className="text-sm font-semibold text-slate-700">Domicilio</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Calle y número"><Input name="calle" defaultValue={paciente.calle ?? ""} /></Field>
        <Field label="Colonia"><Input name="colonia" defaultValue={paciente.colonia ?? ""} /></Field>
        <Field label="Municipio/Alcaldía"><Input name="municipio" defaultValue={paciente.municipio ?? ""} /></Field>
        <Field label="Estado"><Input name="estado" defaultValue={paciente.estado ?? ""} /></Field>
        <Field label="Código postal"><Input name="cp" defaultValue={paciente.cp ?? ""} /></Field>
      </div>

      <p className="text-sm font-semibold text-slate-700">Contacto de emergencia</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Nombre"><Input name="contactoEmergenciaNombre" defaultValue={paciente.contactoEmergenciaNombre ?? ""} /></Field>
        <Field label="Teléfono"><Input name="contactoEmergenciaTelefono" type="tel" defaultValue={paciente.contactoEmergenciaTelefono ?? ""} /></Field>
        <Field label="Parentesco"><Input name="contactoEmergenciaParentesco" defaultValue={paciente.contactoEmergenciaParentesco ?? ""} /></Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" name="prefNotificacionEmail" defaultChecked={paciente.prefNotificacionEmail} className="rounded border-slate-300" />
        Avisarme por correo (recetas, documentos nuevos)
      </label>

      <SubmitButton>Guardar cambios</SubmitButton>
    </form>
  );
}

export function FotoPropiaForm({ fotoActual }: { fotoActual: string | null }) {
  const [state, formAction] = useActionState(guardarFotoPropia, {});
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
    <div className="flex items-center gap-4">
      {fotoActual ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fotoActual} alt="Foto de perfil" className="h-16 w-16 rounded-full border border-slate-200 object-cover" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">Sin foto</div>
      )}
      <form ref={formRef} action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="foto" ref={hiddenRef} />
        <label className="cursor-pointer text-sm text-blue-700 underline">
          {fotoActual ? "Cambiar foto" : "Agregar foto"} (opcional)
          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <ErrorMsg>{state.error}</ErrorMsg>
        {state.ok && <span className="text-xs text-emerald-700">Guardada ✓</span>}
      </form>
    </div>
  );
}
