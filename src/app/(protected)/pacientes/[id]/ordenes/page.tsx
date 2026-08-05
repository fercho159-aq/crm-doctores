import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, Button, EmptyState } from "@/components/ui";
import { cargarExpediente } from "../expediente";
import { OrdenesForm } from "./OrdenesForm";
import { generarOrdenesPdf } from "@/actions/hojasMedicas";
import { CATEGORIA_ORDEN_LABEL } from "@/pdf/formatos";

const fechaHora = (d: Date) =>
  d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" });

export default async function OrdenesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, miAsignacionActiva } = await cargarExpediente(id, { sinBitacora: true });

  const hojas = await db.hojaOrdenes.findMany({
    where: { pacienteId: id },
    include: { partidas: { orderBy: { orden: "asc" } }, elaboradaPor: { select: { nombreCompleto: true } } },
    orderBy: { fechaHora: "desc" },
  });

  const borrador = hojas.find((h) => h.estado === "BORRADOR");
  const firmadas = hojas.filter((h) => h.estado === "FIRMADA");
  const puedeEditar = !!miAsignacionActiva;

  return (
    <div className="space-y-4">
      {!puedeEditar && user.rol !== "ADMIN" && (
        <Card>
          <CardBody>
            <p className="text-sm text-slate-500">
              Necesita una asignación activa con este paciente para indicar órdenes médicas.
            </p>
          </CardBody>
        </Card>
      )}

      {(puedeEditar || borrador) && (
        <OrdenesForm
          pacienteId={id}
          editable={puedeEditar}
          hojaId={borrador?.id}
          cuarto={borrador?.cuarto ?? ""}
          partidas={borrador?.partidas.map((o) => ({ o_categoria: o.categoria, o_texto: o.texto })) ?? []}
        />
      )}

      <Card>
        <CardHeader title="Hojas firmadas" subtitle="Bitácora de indicaciones; cada hoja firmada es inmutable." />
        <CardBody>
          {firmadas.length === 0 ? (
            <EmptyState title="Aún no hay hojas de órdenes firmadas." />
          ) : (
            <div className="divide-y divide-slate-100">
              {firmadas.map((h) => (
                <div key={h.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {fechaHora(h.fechaFirma ?? h.fechaHora)} <Badge tone="green">Firmada</Badge>
                      </p>
                      <p className="text-sm text-slate-500">
                        {h.partidas.length} indicación{h.partidas.length === 1 ? "" : "es"} · {h.elaboradaPor.nombreCompleto}
                      </p>
                    </div>
                    <form action={generarOrdenesPdf.bind(null, h.id) as unknown as (fd: FormData) => Promise<void>}>
                      <Button type="submit" variant="secondary" size="sm">
                        Descargar PDF
                      </Button>
                    </form>
                  </div>
                  <ul className="mt-2 space-y-0.5 text-sm text-slate-600">
                    {h.partidas.map((o) => (
                      <li key={o.id}>
                        <span className="font-medium text-slate-500">
                          {CATEGORIA_ORDEN_LABEL[o.categoria] ?? o.categoria}:
                        </span>{" "}
                        {o.texto}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
