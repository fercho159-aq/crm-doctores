import { requireRole } from "@/lib/authz";
import { RegistrarPacienteForm } from "./RegistrarPacienteForm";

export default async function RegistrarPage() {
  await requireRole("ENFERMERIA", "ADMIN");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Registrar nuevo paciente</h1>
      <p className="text-slate-500">
        Sección A — Ficha de identificación (NOM-004 6.1.1). Al guardar continuará con antecedentes y signos vitales.
      </p>
      <RegistrarPacienteForm />
    </div>
  );
}
