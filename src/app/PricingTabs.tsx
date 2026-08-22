"use client";

import { useState } from "react";
import Link from "next/link";

const PLANS = {
  consultorio: {
    name: "Consultorio",
    subtitle: "Para médicos independientes",
    price: "$0",
    period: "/mes",
    badge: "Gratis para siempre",
    badgeColor: "text-emerald-600",
    cta: "Comenzar gratis",
    ctaStyle: "border border-blue-700 text-blue-700 hover:bg-blue-50",
    features: [
      "Historia clínica completa (NOM-004)",
      "Notas de evolución inmutables",
      "Recetas digitales en PDF",
      "Envío automático por correo al paciente",
      "Gestión de pacientes",
      "1 usuario (doctor)",
    ],
  },
  clinica: {
    name: "Clínica Pro",
    subtitle: "Para clínicas y hospitales",
    price: "$4,500",
    period: " MXN/mes",
    badge: "Factura incluida",
    badgeColor: "text-slate-400",
    cta: "Solicitar demo",
    ctaStyle: "bg-blue-700 text-white hover:bg-blue-800",
    features: [
      "Todo lo del plan Consultorio",
      "Expediente quirúrgico (pre y postoperatorio)",
      "Hojas de consumo e insumos con precios",
      "Alertas automáticas por correo a paciente y doctor",
      "Usuarios ilimitados (doctores, enfermería, admin)",
      "Panel administrativo y bitácora de auditoría",
      "Respaldos cifrados automáticos",
      "Soporte prioritario",
    ],
  },
};

export function PricingTabs() {
  const [active, setActive] = useState<"consultorio" | "clinica">("consultorio");
  const plan = PLANS[active];

  return (
    <div>
      {/* Tabs */}
      <div className="mx-auto flex max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-1">
        <button
          onClick={() => setActive("consultorio")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            active === "consultorio"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Consultorio — Gratis
        </button>
        <button
          onClick={() => setActive("clinica")}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
            active === "clinica"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Clínica Pro
        </button>
      </div>

      {/* Card */}
      <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{plan.subtitle}</p>
          <div className="mt-4">
            <span className="text-5xl font-bold text-slate-900">{plan.price}</span>
            <span className="text-sm text-slate-500">{plan.period}</span>
          </div>
          <p className={`mt-1 text-xs font-medium ${plan.badgeColor}`}>{plan.badge}</p>
        </div>

        <Link
          href="/registro"
          className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${plan.ctaStyle}`}
        >
          {plan.cta}
        </Link>

        <ul className="mt-6 space-y-3">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
              <span className="mt-0.5 text-emerald-500">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
