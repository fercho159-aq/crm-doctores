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

  if (user.workspaceTipo === "BASIC") {
    return <MiConsultaBasic doctorId={doctorId} usuarioId={user.id} hoy={hoy} />;
  }

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
      where: {
        disponibleConsulta: true,
        estado: "CERRADA",
        paciente: { workspaceId: user.workspaceId, asignaciones: { none: { doctorId, estado: "ACTIVA" } } },
      },
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

// Consultorio BASIC: sin enfermería ni quirófano — dashboard reducido a lo que un
// médico independiente usa (Fase 8 del plan: pacientes, consultas de hoy, recetas
// recientes, acción principal "nuevo paciente"). Reutiliza los mismos componentes
// de UI que la vista de CLINIC.
async function MiConsultaBasic({ doctorId, usuarioId, hoy }: { doctorId: string; usuarioId: string; hoy: Date }) {
  const [misAsignaciones, consultasHoy, recetasCount, recetasRecientes] = await Promise.all([
    db.asignacion.findMany({
      where: { doctorId, estado: "ACTIVA" },
      include: { paciente: true, especialidad: true },
      orderBy: { fechaAsignacion: "desc" },
      take: 25,
    }),
    db.notaEvolucion.count({
      where: { asignacion: { doctorId }, elaboradaPorId: usuarioId, fechaHora: { gte: hoy } },
    }),
    db.receta.count({ where: { asignacion: { doctorId } } }),
    db.receta.findMany({
      where: { asignacion: { doctorId } },
      include: { asignacion: { include: { paciente: true } } },
      orderBy: { fechaEmision: "desc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Mi consulta</h1>
        <Link href="/enfermeria/registrar">
          <Button>+ Nuevo paciente</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Pacientes activos" value={misAsignaciones.length} />
        <StatCard label="Consultas hoy" value={consultasHoy} tone="green" />
        <StatCard label="Recetas emitidas" value={recetasCount} tone="amber" />
      </div>

      <Card>
        <CardHeader title="Mis pacientes" subtitle="Pacientes con asignación activa." />
        <CardBody>
          {misAsignaciones.length === 0 ? (
            <EmptyState
              title="Aún no tiene pacientes."
              action={<Link href="/enfermeria/registrar"><Button size="sm">Registrar el primero</Button></Link>}
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {misAsignaciones.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {a.paciente.nombre} {a.paciente.apellidoPaterno} {a.paciente.apellidoMaterno}
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

      <Card>
        <CardHeader title="Recetas recientes" />
        <CardBody>
          {recetasRecientes.length === 0 ? (
            <EmptyState title="Aún no ha emitido recetas." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recetasRecientes.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {r.folio} — {r.asignacion.paciente.nombre} {r.asignacion.paciente.apellidoPaterno}
                    </p>
                    <p className="text-sm text-slate-500">
                      {r.fechaEmision.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}
                      {" · "}
                      <Badge tone={r.estado === "CANCELADA" ? "red" : "green"}>{r.estado === "CANCELADA" ? "Cancelada" : "Emitida"}</Badge>
                    </p>
                  </div>
                  <Link href={`/pacientes/${r.asignacion.pacienteId}/recetas/${r.id}`}>
                    <Button size="sm" variant="secondary">Ver</Button>
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
