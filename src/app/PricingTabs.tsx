"use client";

import { useState } from "react";
import Link from "next/link";

type Solution = "doctores" | "laboratorios" | "farmacias";

const SOLUTIONS: Record<Solution, { label: string; icon: string; available: boolean; plans: PlanData[] }> = {
  doctores: {
    label: "Doctores",
    icon: "🩺",
    available: true,
    plans: [
      {
        name: "Receta",
        subtitle: "Para médicos que solo necesitan recetar",
        price: "$0",
        period: "/mes",
        badge: "Gratis para siempre",
        badgeColor: "text-emerald-600",
        cta: "Comenzar gratis",
        ctaStyle: "border border-blue-700 text-blue-700 hover:bg-blue-50",
        features: [
          "Recetas digitales en PDF",
          "Envío automático por correo al paciente",
          "1 usuario (doctor)",
        ],
      },
      {
        name: "Consultorio",
        subtitle: "Para médicos independientes",
        price: "$199",
        oldPrice: "$499",
        period: " MXN/mes",
        badge: "Precio de lanzamiento",
        badgeColor: "text-emerald-600",
        cta: "Comenzar ahora",
        ctaStyle: "bg-blue-700 text-white hover:bg-blue-800",
        highlight: true,
        popular: true,
        features: [
          "Todo lo del plan Receta",
          "El paciente revisa su consulta, recetas e historial desde la app o sitio web",
          "Importa tus pacientes actuales (nombre, teléfono, correo, enfermedad)",
          "Personaliza tu consultorio con logo y colores propios",
          "Historia clínica completa (NOM-004)",
          "Notas de evolución inmutables",
          "Gestión de pacientes",
        ],
      },
      {
        name: "Clínica Pro",
        subtitle: "Para clínicas y hospitales",
        price: "$699",
        period: " MXN/mes",
        badge: "15 días de prueba gratis",
        badgeColor: "text-emerald-600",
        cta: "Empezar demo de 15 días",
        ctaStyle: "bg-slate-900 text-white hover:bg-slate-800",
        features: [
          "Todo lo del plan Consultorio",
          "Expediente quirúrgico (pre y postoperatorio)",
          "Agenda de pacientes integrada",
          "Hojas de consumo e insumos con precios",
          "Alertas automáticas por correo",
          "Usuarios ilimitados",
          "Panel administrativo y bitácora",
          "Respaldos cifrados automáticos",
          "Soporte prioritario",
        ],
      },
    ],
  },
  laboratorios: {
    label: "Laboratorios",
    icon: "🔬",
    available: false,
    plans: [],
  },
  farmacias: {
    label: "Farmacias",
    icon: "💊",
    available: false,
    plans: [],
  },
};

interface PlanData {
  name: string;
  subtitle: string;
  price: string;
  oldPrice?: string;
  period: string;
  badge: string;
  badgeColor: string;
  cta: string;
  ctaStyle: string;
  highlight?: boolean;
  popular?: boolean;
  features: string[];
}

export function PricingTabs() {
  const [active, setActive] = useState<Solution>("doctores");
  const solution = SOLUTIONS[active];

  return (
    <div>
      {/* Solution tabs */}
      <div className="mx-auto flex max-w-md overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1">
        {(Object.entries(SOLUTIONS) as [Solution, typeof SOLUTIONS.doctores][]).map(([key, sol]) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              active === key
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{sol.icon}</span>
            <span>{sol.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {solution.available ? (
        <div className="mx-auto mt-8 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {solution.plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl bg-white p-7 shadow-sm ${
                plan.highlight
                  ? "border-2 border-blue-700 relative"
                  : "border border-slate-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-700 px-3 py-0.5 text-xs font-semibold text-white">
                  Más popular
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-0.5 text-sm text-slate-500">{plan.subtitle}</p>
              <div className="mt-4">
                {plan.oldPrice && (
                  <span className="mr-2 text-lg text-slate-400 line-through">{plan.oldPrice}</span>
                )}
                <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-500">{plan.period}</span>
              </div>
              <p className={`mt-1 text-xs font-medium ${plan.badgeColor}`}>{plan.badge}</p>

              <Link
                href="/registro"
                className={`mt-5 block w-full rounded-xl py-2.5 text-center text-sm font-semibold transition ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>

              <ul className="mt-5 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="text-5xl">{solution.icon}</div>
          <h3 className="mt-4 text-xl font-bold text-slate-900">
            NovaMedics para {solution.label}
          </h3>
          <p className="mt-2 text-slate-500">
            Estamos desarrollando la solución para {solution.label.toLowerCase()}.
            Déjanos tu correo y te avisamos cuando esté lista.
          </p>
          <div className="mx-auto mt-6 flex max-w-sm gap-2">
            <input
              type="email"
              placeholder="tu@correo.com"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button className="shrink-0 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800">
              Avísame
            </button>
          </div>
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            🚧 Próximamente
          </p>
        </div>
      )}
    </div>
  );
}
