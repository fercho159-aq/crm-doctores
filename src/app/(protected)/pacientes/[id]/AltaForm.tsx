"use client";

import { darAlta } from "@/actions/doctor";
import { Input } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function AltaForm({ asignacionId }: { asignacionId: string }) {
  return (
    <form action={darAlta.bind(null, asignacionId)} className="space-y-2 border-t border-slate-100 pt-3">
      <Input name="motivo" placeholder="Motivo del alta (opcional)" />
      <SubmitButton
        variant="danger"
        className="w-full"
        confirm="Cerrará su episodio en esta especialidad. El expediente permanece; solo se cierra su asignación. ¿Dar de alta?"
      >
        Alta de mi especialidad
      </SubmitButton>
    </form>
  );
}
