import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";

const TONE: Record<string, "amber" | "green" | "red"> = { PENDIENTE: "amber", ENVIADO: "green", FALLIDO: "red" };

export default async function CorreosPage() {
  await requireRole("ADMIN");
  const cola = await db.emailQueue.findMany({
    include: { receta: { include: { asignacion: { include: { paciente: true, doctor: { include: { usuario: true } } } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Monitor de correos (recetas)</h1>
      <Card>
        <CardHeader
          title="Cola de envío"
          subtitle="Reintentos automáticos: 1 min, 10 min, 1 hora. Los fallidos definitivos se reenvían desde el detalle de la receta."
        />
        <CardBody>
          {cola.length === 0 ? (
            <EmptyState title="Sin envíos registrados." />
          ) : (
            <div className="divide-y divide-slate-100">
              {cola.map((eq) => (
                <div key={eq.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {eq.receta.folio} → {eq.destinatario}
                    </p>
                    <p className="text-sm text-slate-500">
                      {eq.receta.asignacion.paciente.nombre} {eq.receta.asignacion.paciente.apellidoPaterno} ·{" "}
                      {eq.receta.asignacion.doctor.usuario.nombreCompleto} · intentos: {eq.intentos}
                      {eq.ultimoError ? ` · ${eq.ultimoError}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={TONE[eq.estado]}>{eq.estado}</Badge>
                    <Link
                      href={`/pacientes/${eq.receta.asignacion.pacienteId}/recetas/${eq.recetaId}`}
                      className="text-sm text-blue-700 underline"
                    >
                      Ver receta
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
