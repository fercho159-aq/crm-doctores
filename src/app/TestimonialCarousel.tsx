"use client";

import { useState, useEffect, useCallback } from "react";

const TESTIMONIALS = [
  {
    stars: 5,
    text: "Llevaba años con expedientes en papel y siempre tenía miedo de una inspección. Con NovaMed en dos días ya tenía todo digitalizado. Muy intuitivo.",
    name: "Dr. Alejandro Ruiz M.",
    specialty: "Traumatología y Ortopedia",
    location: "CDMX",
    initials: "AR",
    color: "bg-blue-600",
  },
  {
    stars: 5,
    text: "Las recetas se envían solas al correo del paciente. Mis pacientes me dicen que se ve muy profesional. Ya no imprimo nada.",
    name: "Dra. Mariana López G.",
    specialty: "Medicina Interna",
    location: "Monterrey, NL",
    initials: "ML",
    color: "bg-teal-600",
  },
  {
    stars: 5,
    text: "Lo que más me gustó es que las notas no se pueden borrar, solo agregar adendas. Eso me da tranquilidad legal. Cumple con todo lo de la NOM-004.",
    name: "Dr. Roberto Sánchez P.",
    specialty: "Cirugía General",
    location: "Guadalajara, JAL",
    initials: "RS",
    color: "bg-indigo-600",
  },
  {
    stars: 4,
    text: "Tengo un consultorio pequeño y pensé que era solo para clínicas grandes. Pero el plan gratuito me alcanza perfecto. Muy recomendable.",
    name: "Dra. Fernanda Torres D.",
    specialty: "Ginecología y Obstetricia",
    location: "Puebla, PUE",
    initials: "FT",
    color: "bg-rose-600",
  },
  {
    stars: 5,
    text: "La hoja de consumo quirúrgico es exactamente lo que necesitaba. Registro cada insumo y el administrador tiene todo claro para cobrar.",
    name: "Dr. Carlos Mendoza R.",
    specialty: "Neurología",
    location: "Querétaro, QRO",
    initials: "CM",
    color: "bg-amber-600",
  },
  {
    stars: 5,
    text: "Nos llegó una verificación sanitaria y pudimos mostrar todo el expediente digital al momento. El verificador quedó satisfecho. Valió cada peso.",
    name: "Dr. Héctor Vega L.",
    specialty: "Cardiología",
    location: "Mérida, YUC",
    initials: "HV",
    color: "bg-emerald-600",
  },
];

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % TESTIMONIALS.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  // Show 1 on mobile, 3 on desktop
  const getVisibleIndices = () => {
    const indices = [];
    for (let i = 0; i < 3; i++) {
      indices.push((current + i) % TESTIMONIALS.length);
    }
    return indices;
  };

  const visible = getVisibleIndices();

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Cards */}
      <div className="relative">
        {/* Mobile: single card */}
        <div className="sm:hidden">
          <TestimonialCard testimonial={TESTIMONIALS[current]} />
        </div>

        {/* Desktop: 3 cards */}
        <div className="hidden gap-6 sm:grid sm:grid-cols-3">
          {visible.map((idx) => (
            <TestimonialCard key={idx} testimonial={TESTIMONIALS[idx]} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          onClick={prev}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:border-blue-700 hover:text-blue-700"
        >
          ←
        </button>
        <div className="flex gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === current ? "w-8 bg-blue-700" : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:border-blue-700 hover:text-blue-700"
        >
          →
        </button>
      </div>
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: (typeof TESTIMONIALS)[number] }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 transition-all">
      {/* Stars */}
      <div className="mb-4 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`text-lg ${i < testimonial.stars ? "text-amber-400" : "text-slate-300"}`}>
            ★
          </span>
        ))}
      </div>

      {/* Quote */}
      <p className="flex-1 text-sm leading-relaxed text-slate-600">
        &ldquo;{testimonial.text}&rdquo;
      </p>

      {/* Author */}
      <div className="mt-5 flex items-center gap-3 border-t border-slate-200 pt-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${testimonial.color} text-sm font-bold text-white`}>
          {testimonial.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{testimonial.name}</p>
          <p className="text-xs text-slate-500">{testimonial.specialty}</p>
          <p className="text-xs text-slate-400">{testimonial.location}</p>
        </div>
      </div>
    </div>
  );
}
