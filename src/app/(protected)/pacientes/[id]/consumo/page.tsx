import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { cargarExpediente } from "../expediente";
import { NuevaHojaConsumoForm } from "./NuevaHojaConsumoForm";

const money = (n: number) => `$ ${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fechaHora = (d: Date) =>
  d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" });

export default async function ConsumoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await cargarExpediente(id, { sinBitacora: true });
  const user = await requireUser();

  const [hojas, cirugias] = await Promise.all([
    db.hojaConsumo.findMany({
      where: { pacienteId: id },
      include: {
        partidas: { select: { importe: true } },
        capturadoPor: { select: { nombreCompleto: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.expedienteQuirurgico.findMany({
      where: { pacienteId: id },
      include: { asignacion: { include: { especialidad: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Enfermería captura piezas; administración pone precios y cierra la cuenta.
  const puedeCapturar = ["ENFERMERIA", "ADMIN", "DOCTOR"].includes(user.rol);

  return (
    <div className="space-y-4">
      {puedeCapturar && (
        <NuevaHojaConsumoForm
          pacienteId={id}
          cirugias={cirugias.map((qx) => ({
            id: qx.id,
            etiqueta: `${qx.asignacion.especialidad.nombre}${
              qx.fechaCirugiaProgramada
                ? ` — ${qx.fechaCirugiaProgramada.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}`
                : ""
            }`,
          }))}
        />
      )}

      <Card>
        <CardHeader
          title="Hojas de consumo"
          subtitle="Control de insumos cobrables en quirófano y en piso. Al cerrarse, la cuenta queda inmutable."
        />
        <CardBody>
          {hojas.length === 0 ? (
            <EmptyState title="Aún no hay hojas de consumo para este paciente." />
          ) : (
            <div className="divide-y divide-slate-100">
              {hojas.map((h) => {
                const total = h.partidas.reduce((s, p) => s + Number(p.importe), 0);
                return (
                  <Link
                    key={h.id}
                    href={`/pacientes/${id}/consumo/${h.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-slate-50"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {h.tipo === "QUIROFANO" ? "Consumo en quirófano" : "Consumo de piso"}{" "}
                        <Badge tone={h.estado === "CERRADA" ? "green" : "amber"}>
                          {h.estado === "CERRADA" ? "Cerrada" : "Abierta"}
                        </Badge>
                      </p>
                      <p className="text-sm text-slate-500">
                        {fechaHora(h.createdAt)} · {h.partidas.length} renglón{h.partidas.length === 1 ? "" : "es"}
                        {h.cuarto ? ` · Cuarto ${h.cuarto}` : ""} · {h.capturadoPor.nombreCompleto}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-blue-800">{money(total)}</p>
                  </Link>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
