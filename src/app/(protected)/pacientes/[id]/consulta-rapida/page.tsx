import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ConsultaRapidaForm } from "./ConsultaRapidaForm";

export default async function ConsultaRapidaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: pacienteId } = await params;
  const user = await requireRole("DOCTOR");

  const paciente = await db.paciente.findUnique({
    where: { id: pacienteId, workspaceId: user.workspaceId },
  });
  if (!paciente) notFound();

  // Buscar asignación activa del doctor con este paciente
  const asignacion = await db.asignacion.findFirst({
    where: { pacienteId, doctorId: user.doctorId!, estado: "ACTIVA" },
  });
  if (!asignacion) notFound();

  const nombrePaciente = `${paciente.nombre} ${paciente.apellidoPaterno} ${paciente.apellidoMaterno ?? ""}`.trim();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consulta rápida</h1>
        <p className="mt-1 text-slate-500">
          {nombrePaciente} · {paciente.numeroExpediente}
        </p>
      </div>
      <ConsultaRapidaForm asignacionId={asignacion.id} />
    </div>
  );
}
