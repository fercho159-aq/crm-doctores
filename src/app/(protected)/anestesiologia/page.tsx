import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";

export default async function AnestesiologiaHome() {
  await requireRole("ANESTESIOLOGO", "ADMIN");

  const cirugias = await db.expedienteQuirurgico.findMany({
    where: { estado: "PREOPERATORIO" },
    include: { paciente: true, notaPre: true },
    orderBy: { fechaCirugiaProgramada: "asc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Anestesiología — Cirugías programadas</h1>
      <Card>
        <CardHeader title="Próximas cirugías" subtitle="Valoración preanestésica y riesgo quirúrgico." />
        <CardBody>
          {cirugias.length === 0 ? (
            <EmptyState title="No hay cirugías programadas por el momento." />
          ) : (
            <div className="divide-y divide-slate-100">
              {cirugias.map((qx) => (
                <div key={qx.id} className="py-3">
                  <p className="font-medium text-slate-800">
                    {qx.paciente.nombre} {qx.paciente.apellidoPaterno}{" "}
                    <Badge tone="blue">{qx.paciente.numeroExpediente}</Badge>
                  </p>
                  <p className="text-sm text-slate-500">
                    {qx.fechaCirugiaProgramada
                      ? qx.fechaCirugiaProgramada.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short", timeZone: "America/Mexico_City" })
                      : "Sin fecha programada"}
                    {qx.quirofanoSede ? ` · ${qx.quirofanoSede}` : ""}
                  </p>
                  {qx.notaPre?.riesgoQuirurgico && (
                    <p className="text-sm text-slate-500">Riesgo: {qx.notaPre.riesgoQuirurgico}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
