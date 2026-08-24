"use client";

import { useActionState } from "react";
import { revisarAportacion } from "@/actions/aportaciones";
import { ErrorMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function RevisarAportacionForm({ aportacionId, asignacionId }: { aportacionId: string; asignacionId: string }) {
  const action = revisarAportacion.bind(null, aportacionId);
  const [stateOk, formActionOk] = useActionState(action, {});
  const [stateNo, formActionNo] = useActionState(action, {});
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <ErrorMsg>{stateOk.error || stateNo.error}</ErrorMsg>
      <form action={formActionOk}>
        <input type="hidden" name="asignacionId" value={asignacionId} />
        <input type="hidden" name="decision" value="INCORPORADA" />
        <SubmitButton
          variant="secondary"
          confirm="Recuerde: esto no copia el texto a su nota. Regístrelo usted mismo antes de marcarlo como incorporado."
        >
          Marcar incorporada
        </SubmitButton>
      </form>
      <form action={formActionNo}>
        <input type="hidden" name="asignacionId" value={asignacionId} />
        <input type="hidden" name="decision" value="RECHAZADA" />
        <SubmitButton variant="secondary">No incorporar</SubmitButton>
      </form>
    </div>
  );
}
