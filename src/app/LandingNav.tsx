"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export function LandingNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-base font-bold text-white">
              N
            </div>
            <span className="text-lg font-bold text-slate-900">NovaMedics</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 sm:flex">
            {/* Soluciones dropdown */}
            <div ref={ref} className="relative">
              <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Soluciones
                <svg className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open && (
                <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
                  <Link
                    href="/"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-lg">🩺</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Doctores</p>
                      <p className="text-xs text-slate-500">Expediente clínico electrónico</p>
                    </div>
                  </Link>
                  <Link
                    href="/soluciones/laboratorios"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-lg">🔬</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Laboratorios
                        <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Próximamente</span>
                      </p>
                      <p className="text-xs text-slate-500">Gestión de muestras y resultados</p>
                    </div>
                  </Link>
                  <Link
                    href="/soluciones/farmacias"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-lg">💊</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Farmacias
                        <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Próximamente</span>
                      </p>
                      <p className="text-xs text-slate-500">Inventario y punto de venta</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/precios"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Precios
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/registro"
            className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:inline-flex"
          >
            Crear consultorio
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}
