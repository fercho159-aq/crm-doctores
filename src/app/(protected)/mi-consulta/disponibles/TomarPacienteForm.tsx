"use client";

import { useActionState } from "react";
import { tomarPaciente } from "@/actions/doctor";
import { Select, ErrorMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function TomarPacienteForm({
  pacienteId,
  especialidades,
}: {
  pacienteId: string;
  especialidades: { id: string; nombre: string }[];
}) {
  const [state, formAction] = useActionState(tomarPaciente, {});
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="pacienteId" value={pacienteId} />
      {especialidades.length === 1 ? (
        <input type="hidden" name="especialidadId" value={especialidades[0].id} />
      ) : (
        <Select name="especialidadId" className="w-auto" defaultValue={especialidades[0]?.id}>
          {especialidades.map((e) => (
            <option key={e.id} value={e.id}>{e.nombre}</option>
          ))}
        </Select>
      )}
      <SubmitButton confirm="Se creará un episodio de atención en su especialidad sobre el expediente único. ¿Tomar paciente?">
        Tomar paciente
      </SubmitButton>
      <ErrorMsg>{state.error}</ErrorMsg>
    </form>
  );
}
