import { redirect } from "next/navigation";
import { cargarExpediente, nombreCompleto } from "../../expediente";
import { RecetaForm } from "./RecetaForm";

export default async function NuevaRecetaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { paciente, miAsignacionActiva } = await cargarExpediente(id, { sinBitacora: true });
  if (!miAsignacionActiva) redirect(`/pacientes/${id}/recetas`);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Nueva receta — {nombreCompleto(paciente)}</h2>
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Este sistema no emite recetas de medicamentos controlados (fracciones I–III del art. 226 LGS).
        Para estos, utilice su recetario especial autorizado por COFEPRIS.
      </div>
      <RecetaForm
        asignacionId={miAsignacionActiva.id}
        emailPaciente={paciente.email}
      />
    </div>
  );
}
