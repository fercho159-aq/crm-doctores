"use client";

import { useActionState } from "react";
import { subirDocumento } from "@/actions/documentos";
import { Field, Select, ErrorMsg, OkMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function SubirDocumentoForm({ pacienteId }: { pacienteId: string }) {
  const [state, formAction] = useActionState(subirDocumento.bind(null, pacienteId), {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Documento adjuntado.</OkMsg>}
      <Field label="Tipo">
        <Select name="tipo" defaultValue="CONSENTIMIENTO" className="w-auto">
          <option value="CONSENTIMIENTO">Consentimiento / contrato</option>
          <option value="ESTUDIO">Estudio de laboratorio/gabinete</option>
          <option value="OTRO">Otro</option>
        </Select>
      </Field>
      <Field label="Archivo (PDF o imagen)">
        <input
          type="file"
          name="archivo"
          accept="application/pdf,image/*"
          required
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
      </Field>
      <SubmitButton>Adjuntar</SubmitButton>
    </form>
  );
}
