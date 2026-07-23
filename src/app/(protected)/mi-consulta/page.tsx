import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, StatCard, Badge, EmptyState, Button } from "@/components/ui";

export default async function MiConsulta() {
  const user = await requireRole("DOCTOR");
  const doctorId = user.doctorId!;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy.getTime() + 86_400_000);

  const [misAsignaciones, citasHoy, disponiblesCount] = await Promise.all([
    db.asignacion.findMany({
      where: { doctorId, estado: "ACTIVA" },
      include: { paciente: true, especialidad: true },
      orderBy: { fechaAsignacion: "desc" },
      take: 25,
    }),
    db.citaPostoperatoria.findMany({
      where: {
        asignacion: { doctorId },
        estado: "PROGRAMADA",
        fechaHoraProgramada: { gte: hoy, lt: manana },
      },
      include: { asignacion: { include: { paciente: true } }, expedienteQx: true },
      orderBy: { fechaHoraProgramada: "asc" },
    }),
    db.hojaPrimerLlenado.count({
      where: { disponibleConsulta: true, estado: "CERRADA", paciente: { asignaciones: { none: { doctorId, estado: "ACTIVA" } } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Mi consulta</h1>
        <Link href="/mi-consulta/disponibles">
          <Button>Pacientes disponibles ({disponiblesCount})</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Pacientes activos" value={misAsignaciones.length} />
        <StatCard label="Citas postoperatorias hoy" value={citasHoy.length} tone="amber" />
        <StatCard label="Disponibles para consulta" value={disponiblesCount} tone="green" />
      </div>

      <Card>
        <CardHeader title="Citas postoperatorias de hoy" />
        <CardBody>
          {citasHoy.length === 0 ? (
            <EmptyState title="Sin citas programadas para hoy." />
          ) : (
            <div className="divide-y divide-slate-100">
              {citasHoy.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {c.fechaHoraProgramada.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" })}{" "}
                      — {c.asignacion.paciente.nombre} {c.asignacion.paciente.apellidoPaterno}
                    </p>
                    <p className="text-sm text-slate-500">{c.motivo}</p>
                  </div>
                  <Link href={`/pacientes/${c.asignacion.pacienteId}/cirugias/${c.expedienteQxId}`}>
                    <Button size="sm" variant="secondary">Abrir</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mis pacientes activos" subtitle="Pacientes con asignación activa en sus especialidades." />
        <CardBody>
          {misAsignaciones.length === 0 ? (
            <EmptyState
              title="No tiene pacientes asignados."
              action={<Link href="/mi-consulta/disponibles"><Button size="sm">Ver disponibles</Button></Link>}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {misAsignaciones.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {a.paciente.nombre} {a.paciente.apellidoPaterno} {a.paciente.apellidoMaterno}{" "}
                      <Badge tone="blue">{a.especialidad.nombre}</Badge>
                    </p>
                    <p className="text-sm text-slate-500">
                      {a.paciente.numeroExpediente} · desde {a.fechaAsignacion.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}
                    </p>
                  </div>
                  <Link href={`/pacientes/${a.pacienteId}`}>
                    <Button size="sm">Abrir expediente</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
