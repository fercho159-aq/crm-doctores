"use client";

import { useState } from "react";
import { Button } from "./ui";

// Tabla de captura con renglones que se agregan y quitan. Los formatos en papel
// son cuadrículas de renglones (prescripción, órdenes, fármacos, cuadrícula del
// transanestésico); cada columna se envía como campo repetido y la Server Action
// lo lee con `formData.getAll(name)`.

export type Columna = {
  /** Nombre del campo; se repite en cada renglón. */
  name: string;
  label: string;
  type?: "text" | "number" | "date" | "time";
  /** Opciones para renderizar un `<select>` en lugar de un `<input>`. */
  opciones?: string[] | { value: string; label: string }[];
  placeholder?: string;
  /** Ancho de la columna en la tabla (clase de Tailwind). */
  ancho?: string;
  step?: string;
};

const claseCampo =
  "w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-100 disabled:bg-slate-50";

function opcionesNormalizadas(op: Columna["opciones"]) {
  if (!op) return [];
  return op.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
}

export function FilasDinamicas({
  columnas,
  inicial,
  minimo = 3,
  editable = true,
  etiquetaAgregar = "Agregar renglón",
}: {
  columnas: Columna[];
  inicial?: Record<string, string>[];
  /** Renglones en blanco que se muestran cuando no hay datos capturados. */
  minimo?: number;
  editable?: boolean;
  etiquetaAgregar?: string;
}) {
  const filasIniciales =
    inicial && inicial.length > 0 ? inicial : Array.from({ length: minimo }, () => ({} as Record<string, string>));
  const [filas, setFilas] = useState(filasIniciales);

  const agregar = () => setFilas((f) => [...f, {}]);
  // Quitar el último renglón basta: el orden se recalcula en el servidor y un
  // renglón vacío se descarta al guardar.
  const quitar = (i: number) => setFilas((f) => (f.length <= 1 ? f : f.filter((_, k) => k !== i)));

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              {columnas.map((c) => (
                <th key={c.name} className={`border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 ${c.ancho ?? ""}`}>
                  {c.label}
                </th>
              ))}
              {editable && <th className="w-10 border border-slate-200" />}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i}>
                {columnas.map((c) => (
                  <td key={c.name} className="border border-slate-200 p-1">
                    {c.opciones ? (
                      <select name={c.name} defaultValue={fila[c.name] ?? ""} className={claseCampo} disabled={!editable}>
                        <option value="">—</option>
                        {opcionesNormalizadas(c.opciones).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        name={c.name}
                        type={c.type ?? "text"}
                        step={c.step}
                        defaultValue={fila[c.name] ?? ""}
                        placeholder={c.placeholder}
                        className={claseCampo}
                        disabled={!editable}
                      />
                    )}
                  </td>
                ))}
                {editable && (
                  <td className="border border-slate-200 p-1 text-center">
                    <button
                      type="button"
                      onClick={() => quitar(i)}
                      aria-label={`Quitar renglón ${i + 1}`}
                      className="rounded px-2 py-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      ×
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && (
        <Button type="button" variant="secondary" size="sm" onClick={agregar}>
          + {etiquetaAgregar}
        </Button>
      )}
    </div>
  );
}
