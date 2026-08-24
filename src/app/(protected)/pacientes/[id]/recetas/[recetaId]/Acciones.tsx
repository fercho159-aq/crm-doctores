"use client";

import { useState, useActionState } from "react";
import { cancelarReceta, reenviarReceta } from "@/actions/recetas";
import { Field, Input, ErrorMsg, OkMsg } from "@/components/ui";
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
  const [showEnviar, setShowEnviar] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);

  return (
    <>
      {/* Botón enviar por email */}
      <button
        onClick={() => setShowEnviar(!showEnviar)}
        className="flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
        Enviar por email
      </button>

      {/* Botón cancelar */}
      {puedeCancelar && (
        <button
          onClick={() => setShowCancelar(!showCancelar)}
          className="flex items-center gap-2 rounded-xl border border-red-300 px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          Cancelar receta
        </button>
      )}

      {/* Form de envío expandible */}
      {showEnviar && (
        <div className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <form action={reenviar} className="space-y-3">
            <ErrorMsg>{rState.error}</ErrorMsg>
            {rState.ok && <OkMsg>Receta enviada.</OkMsg>}
            <Field label="Correo de destino">
              <Input name="destinatario" type="email" defaultValue={emailActual ?? ""} required />
            </Field>
            <SubmitButton className="w-full">Enviar receta</SubmitButton>
          </form>
        </div>
      )}

      {/* Form de cancelación expandible */}
      {showCancelar && (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <form action={cancelar} className="space-y-3">
            <ErrorMsg>{cState.error}</ErrorMsg>
            {cState.ok && <OkMsg>Receta cancelada.</OkMsg>}
            <Field label="Motivo de cancelación">
              <Input name="motivo" required placeholder="Escriba el motivo..." />
            </Field>
            <SubmitButton variant="danger" confirm="La receta quedará CANCELADA. ¿Continuar?">
              Confirmar cancelación
            </SubmitButton>
          </form>
        </div>
      )}
    </>
  );
}
