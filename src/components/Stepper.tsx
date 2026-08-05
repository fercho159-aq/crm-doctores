"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "./ui";

export type Paso = {
  href: string;
  label: string;
  completado: boolean;
  opcional?: boolean;
};

function indiceActual(pasos: Paso[], pathname: string): number {
  // Coincidencia por prefijo más largo (las subrutas cuentan como su paso)
  let idx = -1;
  let mejor = 0;
  pasos.forEach((p, i) => {
    if (pathname === p.href || pathname.startsWith(p.href + "/")) {
      if (p.href.length > mejor) {
        mejor = p.href.length;
        idx = i;
      }
    }
  });
  return idx;
}

export function Stepper({ pasos }: { pasos: Paso[] }) {
  const pathname = usePathname();
  const actual = indiceActual(pasos, pathname);

  return (
    <nav className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-0 py-1">
        {pasos.map((p, i) => {
          const esActual = i === actual;
          return (
            <li key={p.href} className="flex items-center">
              {i > 0 && (
                <div className={cn("h-0.5 w-6 sm:w-10", p.completado || esActual ? "bg-blue-600" : "bg-slate-200")} />
              )}
              <Link
                href={p.href}
                className={cn(
                  "group flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors",
                  esActual ? "bg-blue-700 text-white shadow-sm" : "hover:bg-blue-50",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    esActual
                      ? "bg-white text-blue-700"
                      : p.completado
                        ? "bg-emerald-500 text-white"
                        : "border-2 border-slate-300 bg-white text-slate-400",
                  )}
                >
                  {p.completado && !esActual ? "✓" : i + 1}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-sm font-medium",
                    esActual ? "text-white" : p.completado ? "text-slate-800" : "text-slate-500",
                  )}
                >
                  {p.label}
                  {/* Marca abreviada: con nueve pasos, «(opcional)» completo desborda la barra. */}
                  {p.opcional && (
                    <span
                      title="Paso opcional"
                      className={cn("ml-1 text-xs", esActual ? "text-blue-100" : "text-slate-400")}
                    >
                      opc.
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function StepperFooter({ pasos }: { pasos: Paso[] }) {
  const pathname = usePathname();
  const actual = indiceActual(pasos, pathname);
  if (actual < 0) return null;
  const prev = actual > 0 ? pasos[actual - 1] : null;
  const next = actual < pasos.length - 1 ? pasos[actual + 1] : null;

  return (
    <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
      {prev ? (
        <Link
          href={prev.href}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={next.href}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
        >
          Siguiente: {next.label} →
        </Link>
      ) : (
        <span />
      )}
    </div>
  );
}
