import { requireCapturista } from "@/lib/authz";
import { RegistrarPacienteForm } from "./RegistrarPacienteForm";

export default async function RegistrarPage() {
  await requireCapturista();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">1</span>
        <div className="h-0.5 w-8 bg-slate-200" />
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-sm font-bold text-slate-400">2</span>
        <p className="ml-2 text-sm text-slate-500">
          Paso 1 de 2 — <strong className="text-slate-700">Ficha de identificación</strong> · Paso 2: hoja clínica y signos vitales
        </p>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Registrar nuevo paciente</h1>
      <p className="text-slate-500">
        Sección A — Ficha de identificación (NOM-004 6.1.1). Al guardar continuará con el paso 2.
      </p>
      <RegistrarPacienteForm />
    </div>
  );
}
