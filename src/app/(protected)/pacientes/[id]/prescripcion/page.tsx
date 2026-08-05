import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, Button, EmptyState } from "@/components/ui";
import { cargarExpediente } from "../expediente";
import { PrescripcionForm } from "./PrescripcionForm";
import { generarPrescripcionPdf } from "@/actions/hojasMedicas";

const fechaISO = (d: Date) => d.toISOString().slice(0, 10);
const fechaHora = (d: Date) =>
  d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" });

export default async function PrescripcionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, miAsignacionActiva } = await cargarExpediente(id, { sinBitacora: true });

  const hojas = await db.hojaPrescripcion.findMany({
    where: { pacienteId: id },
    include: { partidas: { orderBy: { orden: "asc" } }, elaboradaPor: { select: { nombreCompleto: true } } },
    orderBy: { fechaHora: "desc" },
  });

  // Se edita el borrador vigente; si todas están firmadas se captura una hoja nueva.
  const borrador = hojas.find((h) => h.estado === "BORRADOR");
  const firmadas = hojas.filter((h) => h.estado === "FIRMADA");
  const puedeEditar = !!miAsignacionActiva;

  return (
    <div className="space-y-4">
      {!puedeEditar && user.rol !== "ADMIN" && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">
              Necesita una asignación activa con este paciente para capturar prescripciones.
            </p>
          </CardBody>
        </Card>
      )}

      {(puedeEditar || borrador) && (
        <PrescripcionForm
          pacienteId={id}
          editable={puedeEditar}
          firmada={false}
          hojaId={borrador?.id}
          inicial={{
            cuarto: borrador?.cuarto ?? "",
            diagnostico: borrador?.diagnostico ?? "",
            dieta: borrador?.dieta ?? "",
          }}
          partidas={
            borrador?.partidas.map((p) => ({
              p_fecha: fechaISO(p.fecha),
              p_medicamento: p.medicamento,
              p_dosis: p.dosis,
              p_via: p.via,
              p_horario: p.horario,
            })) ?? []
          }
        />
      )}

      <Card>
        <CardHeader title="Prescripciones firmadas" subtitle="Cada hoja firmada es inmutable; se descarga en PDF." />
        <CardBody>
          {firmadas.length === 0 ? (
            <EmptyState title="Aún no hay prescripciones firmadas." />
          ) : (
            <div className="divide-y divide-slate-100">
              {firmadas.map((h) => (
                <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {fechaHora(h.fechaFirma ?? h.fechaHora)} <Badge tone="green">Firmada</Badge>
                    </p>
                    <p className="text-sm text-slate-500">
                      {h.partidas.length} medicamento{h.partidas.length === 1 ? "" : "s"}
                      {h.cuarto ? ` · Cuarto ${h.cuarto}` : ""} · {h.elaboradaPor.nombreCompleto}
                    </p>
                  </div>
                  <form action={generarPrescripcionPdf.bind(null, h.id) as unknown as (fd: FormData) => Promise<void>}>
                    <Button type="submit" variant="secondary" size="sm">
                      Descargar PDF
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
