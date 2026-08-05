"use client";

import { Label } from "./ui";

// Grupos de casillas y de opción única para los formatos que en papel son
// listas de verificación (ASA, Goldman, riesgo trombolítico, vía aérea difícil,
// Aldrete, Ramsay, Bromage). Las opciones vienen de `@/lib/escalasAnestesia`,
// las mismas que imprime el PDF.

export type OpcionCasilla = { value: string; label: string; sufijo?: string };

export function normalizar(
  opciones: (string | { clave: string; texto: string; puntos?: number })[],
): OpcionCasilla[] {
  return opciones.map((o) =>
    typeof o === "string"
      ? { value: o, label: o }
      : { value: o.clave, label: o.texto, sufijo: o.puntos !== undefined ? `${o.puntos} pts` : undefined },
  );
}

/** Selección múltiple: todas las casillas comparten `name`, el servidor lee `getAll`. */
export function GrupoCheck({
  name,
  label,
  opciones,
  valores = [],
  editable = true,
  columnas = 1,
}: {
  name: string;
  label?: string;
  opciones: (string | { clave: string; texto: string; puntos?: number })[];
  valores?: string[];
  editable?: boolean;
  columnas?: 1 | 2 | 3;
}) {
  const cols = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-3" }[columnas];
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className={`grid ${cols} gap-x-4 gap-y-1`}>
        {normalizar(opciones).map((o) => (
          <label key={o.value} className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name={name}
              value={o.value}
              defaultChecked={valores.includes(o.value)}
              disabled={!editable}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-700 focus:ring-blue-100"
            />
            <span>
              {o.label}
              {o.sufijo && <span className="ml-1 text-xs text-slate-400">({o.sufijo})</span>}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/** Opción única. Incluye «—» para poder dejar el campo sin marcar. */
export function GrupoRadio({
  name,
  label,
  opciones,
  valor,
  editable = true,
  columnas = 1,
}: {
  name: string;
  label?: string;
  opciones: (string | { clave: string; texto: string; puntos?: number })[];
  valor?: string | null;
  editable?: boolean;
  columnas?: 1 | 2 | 3;
}) {
  const cols = { 1: "grid-cols-1", 2: "grid-cols-1 sm:grid-cols-2", 3: "grid-cols-1 sm:grid-cols-3" }[columnas];
  return (
    <div>
      {label && <Label>{label}</Label>}
      <div className={`grid ${cols} gap-x-4 gap-y-1`}>
        {normalizar(opciones).map((o) => (
          <label key={o.value} className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={name}
              value={o.value}
              defaultChecked={valor === o.value}
              disabled={!editable}
              className="mt-0.5 h-4 w-4 shrink-0 border-slate-300 text-blue-700 focus:ring-blue-100"
            />
            <span>
              {o.label}
              {o.sufijo && <span className="ml-1 text-xs text-slate-400">({o.sufijo})</span>}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

/** Par de casillas Sí/No que el servidor interpreta como booleano. */
export function SiNo({
  name,
  label,
  valor,
  editable = true,
}: {
  name: string;
  label: string;
  valor?: boolean | null;
  editable?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-4">
        {[
          { v: "true", t: "Sí" },
          { v: "false", t: "No" },
        ].map((o) => (
          <label key={o.v} className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="radio"
              name={name}
              value={o.v}
              defaultChecked={valor === (o.v === "true")}
              disabled={!editable}
              className="h-4 w-4 border-slate-300 text-blue-700 focus:ring-blue-100"
            />
            {o.t}
          </label>
        ))}
      </div>
    </div>
  );
}
