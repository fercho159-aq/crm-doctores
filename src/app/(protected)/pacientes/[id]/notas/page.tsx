import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { cargarExpediente } from "../expediente";
import { NotaEditor, AdendaForm } from "./NotaEditor";

export default async function NotasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const { id } = await params;
  const { nueva } = await searchParams;
  const { user, miAsignacionActiva } = await cargarExpediente(id, { sinBitacora: true });

  const notas = await db.notaEvolucion.findMany({
    where: { asignacion: { pacienteId: id }, notaPadreId: null },
    include: {
      asignacion: { include: { especialidad: true, doctor: { include: { usuario: true } } } },
      elaboradaPor: true,
      adendas: { include: { elaboradaPor: true }, orderBy: { fechaHora: "asc" } },
    },
    orderBy: { fechaHora: "desc" },
  });

  const borradorPropio = notas.find((n) => n.estado === "BORRADOR" && n.elaboradaPorId === user.id);
  const visibles = notas.filter((n) => n.estado !== "BORRADOR" || n.elaboradaPorId === user.id);

  return (
    <div className="space-y-4">
      {miAsignacionActiva && (nueva || borradorPropio) && (
        <NotaEditor
          asignacionId={miAsignacionActiva.id}
          notaId={borradorPropio?.id ?? null}
          inicial={
            borradorPropio
              ? {
                  subjetivo: borradorPropio.subjetivo ?? "",
                  objetivo: borradorPropio.objetivo ?? "",
                  resultadosEstudios: borradorPropio.resultadosEstudios ?? "",
                  diagnosticos: borradorPropio.diagnosticos ?? "",
                  pronostico: borradorPropio.pronostico ?? "",
                  planTratamiento: borradorPropio.planTratamiento ?? "",
                }
              : undefined
          }
        />
      )}

      {visibles.length === 0 && !nueva ? (
        <EmptyState title="Este paciente aún no tiene notas de evolución." />
      ) : (
        visibles
          .filter((n) => n.id !== borradorPropio?.id)
          .map((n) => (
            <Card key={n.id}>
              <CardHeader
                title={`${n.asignacion.especialidad.nombre} — ${n.elaboradaPor.nombreCompleto}`}
                subtitle={n.fechaHora.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
                action={
                  <Badge tone={n.estado === "FIRMADA" ? "green" : n.estado === "CANCELADA" ? "red" : "amber"}>
                    {n.estado === "FIRMADA" ? "Firmada" : n.estado === "CANCELADA" ? "Cancelada" : "Borrador"}
                  </Badge>
                }
              />
              <CardBody className="space-y-3 text-sm">
                {n.subjetivo && <p><strong>S:</strong> {n.subjetivo}</p>}
                {n.objetivo && <p><strong>O:</strong> {n.objetivo}</p>}
                {n.resultadosEstudios && <p><strong>Estudios:</strong> {n.resultadosEstudios}</p>}
                {n.diagnosticos && <p><strong>A / Diagnóstico:</strong> {n.diagnosticos}</p>}
                {n.planTratamiento && <p><strong>P / Plan:</strong> {n.planTratamiento}</p>}
                {n.pronostico && <p><strong>Pronóstico:</strong> {n.pronostico}</p>}

                {n.adendas.length > 0 && (
                  <div className="space-y-2 border-l-4 border-amber-300 pl-3">
                    {n.adendas.map((ad) => (
                      <div key={ad.id}>
                        <p className="text-xs text-slate-500">
                          ADENDA · {ad.elaboradaPor.nombreCompleto} · {ad.fechaHora.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
                        </p>
                        <p>{ad.subjetivo}</p>
                      </div>
                    ))}
                  </div>
                )}

                {n.estado === "FIRMADA" && miAsignacionActiva && n.asignacionId === miAsignacionActiva.id && (
                  <AdendaForm notaPadreId={n.id} />
                )}
              </CardBody>
            </Card>
          ))
      )}
    </div>
  );
}
