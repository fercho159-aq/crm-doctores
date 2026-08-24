import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
import { cargarPacientePropio } from "../../paciente";

export default async function RecetaDetallePortal({ params }: { params: Promise<{ recetaId: string }> }) {
  const { recetaId } = await params;
  const { paciente } = await cargarPacientePropio({ sinBitacora: true });

  const receta = await db.receta.findUnique({
    where: { id: recetaId },
    include: {
      partidas: { orderBy: { orden: "asc" } },
      documento: true,
      asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } },
    },
  });
  // Comparación directa contra el paciente de la sesión: un id de receta ajeno
  // siempre resulta en 404, nunca en una fuga de datos de otro paciente.
  if (!receta || receta.asignacion.pacienteId !== paciente.id) notFound();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`Receta ${receta.folio}`}
          subtitle={`${receta.asignacion.doctor.usuario.nombreCompleto} (${receta.asignacion.especialidad.nombre}) · ${receta.fechaEmision.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}`}
          action={receta.estado === "CANCELADA" ? <Badge tone="red">CANCELADA</Badge> : <Badge tone="green">Vigente</Badge>}
        />
        <CardBody className="space-y-3 text-sm">
          {receta.estado === "CANCELADA" && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-red-800">
              Esta receta fue cancelada por su médico. Motivo: {receta.motivoCancelacion}
            </div>
          )}
          {receta.diagnostico && <p><strong>Diagnóstico:</strong> {receta.diagnostico}</p>}
          <div className="divide-y divide-slate-100">
            {receta.partidas.map((p) => (
              <div key={p.id} className="py-2">
                <p className="font-medium text-slate-800">
                  {p.orden}. {p.medicamento} {p.presentacion ? `— ${p.presentacion}` : ""} {p.cantidad ? `(${p.cantidad})` : ""}
                </p>
                <p className="text-slate-600">{p.dosis} · {p.viaAdministracion} · {p.frecuencia} · {p.duracion}</p>
                {p.indicaciones && <p className="text-slate-500">{p.indicaciones}</p>}
              </div>
            ))}
          </div>
          {receta.indicacionesGenerales && <p><strong>Indicaciones generales:</strong> {receta.indicacionesGenerales}</p>}
          {receta.documento && (
            <a href={`/api/documentos/${receta.documento.id}`} target="_blank" className="inline-block font-medium text-blue-700 underline">
              Descargar / imprimir PDF
            </a>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
