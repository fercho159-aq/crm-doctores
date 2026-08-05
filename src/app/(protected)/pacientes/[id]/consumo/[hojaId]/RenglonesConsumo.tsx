"use client";

import { useActionState, useState } from "react";
import { guardarRenglonConsumo, eliminarRenglonConsumo, cerrarHojaConsumo } from "@/actions/consumo";
import { Card, CardHeader, CardBody, Field, Input, Select, ErrorMsg, OkMsg, Button, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import type { ActionState } from "@/actions/auth";

export type InsumoOpcion = { id: string; nombre: string; categoria: string; precio: number };
export type PartidaVista = {
  id: string;
  descripcion: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
  fecha: string | null;
  enfermera: string | null;
  observaciones: string | null;
};

const money = (n: number) => `$ ${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CATEGORIAS = [
  { value: "MATERIAL", label: "Material" },
  { value: "MEDICAMENTO", label: "Medicamento" },
  { value: "SUTURA", label: "Sutura" },
  { value: "SOLUCION", label: "Solución" },
  { value: "SERVICIO", label: "Servicio" },
  { value: "OTRO", label: "Otro" },
];

/** Alta de renglón: del catálogo (precio vigente) o libre (precio a mano). */
function AltaRenglon({
  hojaId,
  insumos,
  esPiso,
  puedeFijarPrecio,
}: {
  hojaId: string;
  insumos: InsumoOpcion[];
  esPiso: boolean;
  puedeFijarPrecio: boolean;
}) {
  const [state, formAction] = useActionState(
    async (prev: ActionState, fd: FormData): Promise<ActionState> => guardarRenglonConsumo(hojaId, prev, fd),
    {},
  );
  const [insumoId, setInsumoId] = useState("");
  const seleccionado = insumos.find((i) => i.id === insumoId);

  return (
    <form action={formAction} className="space-y-3 border-t border-slate-100 pt-4">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Renglón registrado.</OkMsg>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Insumo del catálogo" hint="Deje vacío para capturar un concepto libre.">
          <Select name="insumoId" value={insumoId} onChange={(e) => setInsumoId(e.target.value)}>
            <option value="">— Concepto libre —</option>
            {insumos.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} {i.precio > 0 ? `(${money(i.precio)})` : ""}
              </option>
            ))}
          </Select>
        </Field>

        {!insumoId && (
          <>
            <Field label="Descripción" required>
              <Input name="descripcion" placeholder="Material, medicamento o servicio" />
            </Field>
            <Field label="Categoría">
              <Select name="categoria" defaultValue="OTRO">
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}

        <Field label="Cantidad (PZ.)" required>
          <Input name="cantidad" type="number" step="0.01" min="0.01" defaultValue="1" required />
        </Field>

        <Field
          label="Precio unitario"
          hint={
            seleccionado && !puedeFijarPrecio
              ? `Precio del catálogo: ${money(seleccionado.precio)}`
              : "En blanco toma el precio del catálogo."
          }
        >
          <Input
            name="precioUnitario"
            type="number"
            step="0.01"
            min="0"
            defaultValue=""
            placeholder={seleccionado ? String(seleccionado.precio) : ""}
            disabled={!puedeFijarPrecio && !!insumoId}
          />
        </Field>

        {esPiso && (
          <>
            <Field label="Fecha">
              <Input name="fecha" type="date" />
            </Field>
            <Field label="Enfermera">
              <Input name="enfermera" />
            </Field>
            <Field label="Observaciones">
              <Input name="observaciones" />
            </Field>
          </>
        )}
      </div>

      <SubmitButton variant="secondary">Agregar renglón</SubmitButton>
    </form>
  );
}

function BotonEliminar({ partidaId }: { partidaId: string }) {
  const [state, formAction] = useActionState(
    async (): Promise<ActionState> => eliminarRenglonConsumo(partidaId),
    {},
  );
  return (
    <form action={formAction}>
      <ErrorMsg>{state.error}</ErrorMsg>
      <button
        type="submit"
        className="rounded px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
        aria-label="Eliminar renglón"
        onClick={(e) => {
          if (!window.confirm("¿Eliminar este renglón de la cuenta?")) e.preventDefault();
        }}
      >
        ×
      </button>
    </form>
  );
}

function BotonCerrar({ hojaId }: { hojaId: string }) {
  const [state, formAction] = useActionState(async (): Promise<ActionState> => cerrarHojaConsumo(hojaId), {});
  return (
    <form action={formAction}>
      <ErrorMsg>{state.error}</ErrorMsg>
      <Button
        type="submit"
        size="sm"
        onClick={(e) => {
          if (!window.confirm("Al cerrar la hoja la cuenta queda INMUTABLE y no se podrán editar renglones. ¿Cerrar?")) {
            e.preventDefault();
          }
        }}
      >
        Cerrar hoja y fijar cuenta
      </Button>
    </form>
  );
}

export function RenglonesConsumo({
  hojaId,
  tipo,
  cerrada,
  partidas,
  insumos,
  puedeCapturar,
  puedeCerrar,
  puedeFijarPrecio,
}: {
  hojaId: string;
  tipo: "QUIROFANO" | "PISO";
  cerrada: boolean;
  partidas: PartidaVista[];
  insumos: InsumoOpcion[];
  puedeCapturar: boolean;
  puedeCerrar: boolean;
  puedeFijarPrecio: boolean;
}) {
  const total = partidas.reduce((s, p) => s + p.importe, 0);
  const sinPrecio = partidas.filter((p) => p.precioUnitario === 0).length;

  return (
    <Card>
      <CardHeader
        title="Renglones de la cuenta"
        subtitle={
          sinPrecio > 0 && !cerrada
            ? `${sinPrecio} renglón(es) sin precio: administración debe capturarlo antes de cerrar.`
            : undefined
        }
        action={
          cerrada ? <Badge tone="green">Cerrada — inmutable</Badge> : <Badge tone="amber">Abierta</Badge>
        }
      />
      <CardBody className="space-y-4">
        {partidas.length === 0 ? (
          <p className="py-2 text-sm text-slate-500">Sin renglones capturados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold text-slate-600">
                  {tipo === "PISO" && <th className="border border-slate-200 px-2 py-1.5">Fecha</th>}
                  {tipo === "PISO" && <th className="border border-slate-200 px-2 py-1.5">Enfermera</th>}
                  <th className="border border-slate-200 px-2 py-1.5">Concepto</th>
                  <th className="border border-slate-200 px-2 py-1.5">Categoría</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-right">Cant.</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-right">P. unitario</th>
                  <th className="border border-slate-200 px-2 py-1.5 text-right">Importe</th>
                  {tipo === "PISO" && <th className="border border-slate-200 px-2 py-1.5">Observaciones</th>}
                  {!cerrada && puedeCapturar && <th className="w-10 border border-slate-200" />}
                </tr>
              </thead>
              <tbody>
                {partidas.map((p) => (
                  <tr key={p.id}>
                    {tipo === "PISO" && <td className="border border-slate-200 px-2 py-1">{p.fecha ?? ""}</td>}
                    {tipo === "PISO" && <td className="border border-slate-200 px-2 py-1">{p.enfermera ?? ""}</td>}
                    <td className="border border-slate-200 px-2 py-1">{p.descripcion}</td>
                    <td className="border border-slate-200 px-2 py-1 text-slate-500">{p.categoria}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right">{p.cantidad}</td>
                    <td className="border border-slate-200 px-2 py-1 text-right">
                      {p.precioUnitario === 0 ? <span className="text-amber-700">pendiente</span> : money(p.precioUnitario)}
                    </td>
                    <td className="border border-slate-200 px-2 py-1 text-right font-medium">{money(p.importe)}</td>
                    {tipo === "PISO" && <td className="border border-slate-200 px-2 py-1">{p.observaciones ?? ""}</td>}
                    {!cerrada && puedeCapturar && (
                      <td className="border border-slate-200 p-1 text-center">
                        <BotonEliminar partidaId={p.id} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 font-semibold">
                  <td className="border border-slate-200 px-2 py-1.5 text-right" colSpan={tipo === "PISO" ? 6 : 4}>
                    TOTAL
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-right text-blue-800">{money(total)}</td>
                  {tipo === "PISO" && <td className="border border-slate-200" />}
                  {!cerrada && puedeCapturar && <td className="border border-slate-200" />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {!cerrada && puedeCapturar && (
          <AltaRenglon hojaId={hojaId} insumos={insumos} esPiso={tipo === "PISO"} puedeFijarPrecio={puedeFijarPrecio} />
        )}

        {!cerrada && puedeCerrar && (
          <div className="flex justify-end border-t border-slate-100 pt-4">
            <BotonCerrar hojaId={hojaId} />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
