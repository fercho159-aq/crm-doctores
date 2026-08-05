"use client";

import { useActionState, useState } from "react";
import { generarFichaIdentificacion } from "@/actions/formatos";
import { Card, CardHeader, CardBody, Field, Input, ErrorMsg, Button } from "@/components/ui";
import { SignaturePad } from "@/components/SignaturePad";
import { SubmitButton } from "@/components/forms";
import type { ActionState } from "@/actions/auth";

// Hoja oficial 2. Los datos del paciente y del médico tratante salen del
// expediente; aquí sólo se completan los del responsable y se recaban las firmas.
export function FichaIdentificacionForm({
  pacienteId,
  responsable,
}: {
  pacienteId: string;
  responsable: { nombre: string; parentesco: string; telefono: string };
}) {
  const [state, formAction] = useActionState(
    async (prev: ActionState, fd: FormData): Promise<ActionState> =>
      (await generarFichaIdentificacion(pacienteId, prev, fd)) ?? {},
    {},
  );
  const [abierto, setAbierto] = useState(false);

  return (
    <Card>
      <button type="button" className="w-full text-left" onClick={() => setAbierto((v) => !v)}>
        <CardHeader
          title={`${abierto ? "▾" : "▸"} Ficha de identificación`}
          subtitle="Formato del expediente con datos del paciente, responsable y médico tratante."
        />
      </button>
      {abierto && (
        <CardBody>
          <form action={formAction} className="space-y-4">
            <ErrorMsg>{state.error}</ErrorMsg>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Diagnóstico" hint="En blanco toma el motivo de consulta de la historia clínica.">
                <Input name="diagnostico" />
              </Field>
              <Field label="Hora">
                <Input name="hora" type="time" />
              </Field>
            </div>

            <p className="text-sm font-semibold text-slate-700">Datos del responsable del paciente</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Nombre">
                <Input name="nombreResponsable" defaultValue={responsable.nombre} />
              </Field>
              <Field label="Parentesco">
                <Input name="parentescoResponsable" defaultValue={responsable.parentesco} />
              </Field>
              <Field label="Teléfono">
                <Input name="telefonoResponsable" defaultValue={responsable.telefono} />
              </Field>
              <Field label="Domicilio">
                <Input name="domicilioResponsable" />
              </Field>
              <Field label="Colonia">
                <Input name="coloniaResponsable" />
              </Field>
              <Field label="C.P.">
                <Input name="cpResponsable" />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <SignaturePad name="firmaPaciente" label="Firma del paciente" />
              <SignaturePad name="firmaMedico" label="Firma del médico" />
              <SignaturePad name="firmaFamiliar" label="Firma del familiar" />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => setAbierto(false)}>
                Cancelar
              </Button>
              <SubmitButton>Generar ficha (PDF)</SubmitButton>
            </div>
          </form>
        </CardBody>
      )}
    </Card>
  );
}
