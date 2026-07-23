import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardBody, Badge, EmptyState } from "@/components/ui";
import { cargarExpediente } from "../expediente";
import { IniciarQxForm } from "./IniciarQxForm";

const ESTADO_QX: Record<string, { label: string; tone: "blue" | "green" | "red" }> = {
  PREOPERATORIO: { label: "Preoperatorio", tone: "blue" },
  REALIZADA: { label: "Realizada", tone: "green" },
  CANCELADA: { label: "Cancelada", tone: "red" },
};

export default async function CirugiasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const { miAsignacionActiva } = await cargarExpediente(id, { sinBitacora: true });

  const cirugias = await db.expedienteQuirurgico.findMany({
    where: { pacienteId: id },
    include: {
      asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } },
      notaPre: true,
      notaPost: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      {miAsignacionActiva && nuevo && <IniciarQxForm asignacionId={miAsignacionActiva.id} />}
      {cirugias.length === 0 && !nuevo ? (
        <EmptyState title="Sin expedientes quirúrgicos." />
      ) : (
        <Card>
          <CardBody>
            <div className="divide-y divide-slate-100">
              {cirugias.map((qx) => (
                <Link
                  key={qx.id}
                  href={`/pacientes/${id}/cirugias/${qx.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {qx.notaPre?.planQuirurgico ?? "Expediente quirúrgico"} — {qx.asignacion.especialidad.nombre}
                    </p>
                    <p className="text-sm text-slate-500">
                      {qx.asignacion.doctor.usuario.nombreCompleto}
                      {qx.fechaCirugiaProgramada
                        ? ` · programada ${qx.fechaCirugiaProgramada.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge tone={ESTADO_QX[qx.estado].tone}>{ESTADO_QX[qx.estado].label}</Badge>
                    {qx.notaPre?.estado === "FIRMADA" && <Badge tone="green">Pre firmada</Badge>}
                    {qx.notaPost?.estado === "FIRMADA" && <Badge tone="green">Post firmada</Badge>}
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
