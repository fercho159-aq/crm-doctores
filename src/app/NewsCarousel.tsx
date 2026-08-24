"use client";

import { useState } from "react";

const NEWS = [
  {
    source: "Milenio",
    title: "Senado propone creación de expediente clínico único",
    description: "La iniciativa busca que todos los mexicanos cuenten con un expediente clínico electrónico único que facilite la atención médica.",
    url: "https://www.milenio.com/salud/senado-proponen-creacion-expediente-clinico-unico",
  },
  {
    source: "ExpoMed Hub",
    title: "El reto de la digitalización de expedientes electrónicos",
    description: "La digitalización del expediente clínico es uno de los mayores retos del sistema de salud en México.",
    url: "https://www.expomedhub.com/nota/innovacion/reto-digitalizacion-expedientes-electronicos",
  },
  {
    source: "DOF — Gobierno de México",
    title: "NOM-004-SSA3-2012 — Del expediente clínico",
    description: "Norma Oficial Mexicana que establece los criterios para la integración y uso del expediente clínico.",
    url: "https://dof.gob.mx/normasOficiales/8305/salud11_C/salud11_C.html",
  },
];

export function NewsCarousel() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((c) => (c === 0 ? NEWS.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === NEWS.length - 1 ? 0 : c + 1));

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {NEWS.map((item) => (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full shrink-0 flex-col justify-between p-6 sm:p-8 hover:bg-slate-50 transition"
            >
              <div>
                <p className="mb-2 inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {item.source}
                </p>
                <h3 className="text-lg font-bold text-slate-900 sm:text-xl">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.description}</p>
              </div>
              <p className="mt-4 text-sm font-semibold text-blue-700">Leer nota →</p>
            </a>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          onClick={prev}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex gap-2">
          {NEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? "w-6 bg-blue-700" : "w-2 bg-slate-300"
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-100"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}
