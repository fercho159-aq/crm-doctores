"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { actualizarPrecioInsumo } from "@/actions/consumo";
import { Input } from "@/components/ui";
import type { ActionState } from "@/actions/auth";

function Guardar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
    >
      {pending ? "…" : "Guardar"}
    </button>
  );
}

/** Un renglón del catálogo: el precio se guarda por insumo, sin recargar la tabla. */
export function PrecioForm({ insumoId, precio }: { insumoId: string; precio: number }) {
  const [state, formAction] = useActionState(
    async (prev: ActionState, fd: FormData): Promise<ActionState> => actualizarPrecioInsumo(insumoId, prev, fd),
    {},
  );
  return (
    <form action={formAction} className="flex items-center justify-end gap-2">
      <Input
        name="precio"
        type="number"
        step="0.01"
        min="0"
        defaultValue={precio || ""}
        placeholder="0.00"
        className="w-28 py-1 text-right text-sm"
      />
      <Guardar />
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.ok && <span className="text-xs text-emerald-600">✓</span>}
    </form>
  );
}
