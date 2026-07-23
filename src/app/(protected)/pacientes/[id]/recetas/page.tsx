import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardBody, Badge, Button, EmptyState } from "@/components/ui";
import { cargarExpediente } from "../expediente";

const ENVIO: Record<string, { label: string; tone: "blue" | "green" | "red" | "slate" | "amber" }> = {
  PENDIENTE: { label: "Envío pendiente", tone: "amber" },
  ENVIADA: { label: "Enviada por correo", tone: "green" },
  ERROR: { label: "Error de envío", tone: "red" },
  SIN_CORREO: { label: "Sin correo", tone: "slate" },
};

export default async function RecetasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { miAsignacionActiva } = await cargarExpediente(id, { sinBitacora: true });

  const recetas = await db.receta.findMany({
    where: { asignacion: { pacienteId: id } },
    include: { asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } }, partidas: true },
    orderBy: { fechaEmision: "desc" },
  });

  return (
    <div className="space-y-4">
      {miAsignacionActiva && (
        <div className="flex justify-end">
          <Link href={`/pacientes/${id}/recetas/nueva`}>
            <Button>+ Nueva receta</Button>
          </Link>
        </div>
      )}
      {recetas.length === 0 ? (
        <EmptyState
          title="Este paciente aún no tiene recetas."
          action={miAsignacionActiva ? <Link href={`/pacientes/${id}/recetas/nueva`}><Button size="sm">Nueva receta</Button></Link> : undefined}
        />
      ) : (
        <Card>
          <CardBody>
            <div className="divide-y divide-slate-100">
              {recetas.map((r) => (
                <Link
                  key={r.id}
                  href={`/pacientes/${id}/recetas/${r.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {r.folio} · {r.asignacion.doctor.usuario.nombreCompleto} ({r.asignacion.especialidad.nombre})
                    </p>
                    <p className="text-sm text-slate-500">
                      {r.fechaEmision.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })} ·{" "}
                      {r.partidas.map((p) => p.medicamento).join(", ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {r.estado === "CANCELADA" ? (
                      <Badge tone="red">Cancelada</Badge>
                    ) : (
                      <Badge tone={ENVIO[r.estadoEnvio].tone}>{ENVIO[r.estadoEnvio].label}</Badge>
                    )}
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
