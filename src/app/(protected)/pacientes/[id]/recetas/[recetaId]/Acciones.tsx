"use client";

import { useActionState } from "react";
import { cancelarReceta, reenviarReceta } from "@/actions/recetas";
import { Card, CardHeader, CardBody, Field, Input, ErrorMsg, OkMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function CancelarReenviarReceta({
  recetaId,
  emailActual,
  puedeCancelar,
  envioFallido,
}: {
  recetaId: string;
  emailActual: string | null;
  puedeCancelar: boolean;
  envioFallido: boolean;
}) {
  const [cState, cancelar] = useActionState(cancelarReceta.bind(null, recetaId), {});
  const [rState, reenviar] = useActionState(reenviarReceta.bind(null, recetaId), {});

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader title={envioFallido ? "Corregir correo y reenviar" : "Reenviar por correo"} />
        <CardBody>
          <form action={reenviar} className="space-y-3">
            <ErrorMsg>{rState.error}</ErrorMsg>
            {rState.ok && <OkMsg>Encolado para reenvío.</OkMsg>}
            <Field label="Correo de destino">
              <Input name="destinatario" type="email" defaultValue={emailActual ?? ""} required />
            </Field>
            <SubmitButton variant="secondary">Reenviar receta</SubmitButton>
          </form>
        </CardBody>
      </Card>

      {puedeCancelar && (
        <Card>
          <CardHeader title="Cancelar receta" subtitle="No se elimina: queda visible como cancelada, con motivo." />
          <CardBody>
            <form action={cancelar} className="space-y-3">
              <ErrorMsg>{cState.error}</ErrorMsg>
              {cState.ok && <OkMsg>Receta cancelada.</OkMsg>}
              <Field label="Motivo (obligatorio)">
                <Input name="motivo" required />
              </Field>
              <SubmitButton variant="danger" confirm="La receta quedará CANCELADA de forma permanente (emita una nueva si es necesario). ¿Continuar?">
                Cancelar receta
              </SubmitButton>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
