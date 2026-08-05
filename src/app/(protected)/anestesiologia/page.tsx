import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";

export default async function AnestesiologiaHome() {
  await requireRole("ANESTESIOLOGO", "ADMIN");

  // Se listan las programadas y las ya realizadas cuyo expediente anestésico
  // pueda seguir abierto (la nota post-anestésica se captura tras la cirugía).
  const cirugias = await db.expedienteQuirurgico.findMany({
    where: { estado: { in: ["PREOPERATORIO", "REALIZADA"] } },
    include: {
      paciente: true,
      notaPre: true,
      valoracionPre: { select: { estado: true } },
      registroAnestesico: { select: { estado: true } },
      notaPostanestesica: { select: { estado: true } },
    },
    orderBy: { fechaCirugiaProgramada: "asc" },
    take: 40,
  });

  const etapa = (e: { estado: string } | null, nombre: string) =>
    e ? (
      <Badge key={nombre} tone={e.estado === "FIRMADA" ? "green" : "amber"}>
        {nombre}: {e.estado === "FIRMADA" ? "firmada" : "borrador"}
      </Badge>
    ) : (
      <Badge key={nombre} tone="slate">{nombre}: pendiente</Badge>
    );

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
                <Link key={qx.id} href={`/anestesiologia/${qx.id}`} className="block py-3 hover:bg-slate-50">
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
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {etapa(qx.valoracionPre, "Preanestésica")}
                    {etapa(qx.registroAnestesico, "Registro")}
                    {etapa(qx.notaPostanestesica, "Post-anestésica")}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
