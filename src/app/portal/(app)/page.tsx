import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, EmptyState, Button } from "@/components/ui";
import { cargarPacientePropio } from "./paciente";

export default async function PortalInicio() {
  const { paciente } = await cargarPacientePropio();

  const [asignacionesActivas, proximaCita, ultimaNota, recetasRecientes, documentosRecientes] = await Promise.all([
    db.asignacion.findMany({
      where: { pacienteId: paciente.id, estado: "ACTIVA" },
      include: { especialidad: true, doctor: { include: { usuario: true } } },
      orderBy: { fechaAsignacion: "desc" },
    }),
    db.citaPostoperatoria.findFirst({
      where: { asignacion: { pacienteId: paciente.id }, estado: "PROGRAMADA", fechaHoraProgramada: { gte: new Date() } },
      orderBy: { fechaHoraProgramada: "asc" },
      include: { asignacion: { include: { doctor: { include: { usuario: true } } } } },
    }),
    db.notaEvolucion.findFirst({
      where: { asignacion: { pacienteId: paciente.id }, estado: "FIRMADA" },
      orderBy: { fechaHora: "desc" },
      include: { asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } } },
    }),
    db.receta.findMany({
      where: { asignacion: { pacienteId: paciente.id }, estado: "EMITIDA" },
      orderBy: { fechaEmision: "desc" },
      take: 3,
      include: { asignacion: { include: { doctor: { include: { usuario: true } } } } },
    }),
    db.documento.findMany({ where: { pacienteId: paciente.id }, orderBy: { fecha: "desc" }, take: 3 }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Hola, {paciente.nombre}</h1>
        <p className="text-sm text-slate-500">Este es el resumen de su atención.</p>
      </div>

      {proximaCita && (
        <Card>
          <CardHeader title="Próxima cita" action={<Badge tone="blue">Programada</Badge>} />
          <CardBody className="text-sm text-slate-700">
            <p className="font-medium">
              {proximaCita.fechaHoraProgramada.toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "full", timeStyle: "short" })}
            </p>
            <p className="text-slate-500">
              {proximaCita.motivo} · {proximaCita.asignacion.doctor.usuario.nombreCompleto}
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader title="Médico(s) tratante(s)" />
        <CardBody>
          {asignacionesActivas.length === 0 ? (
            <EmptyState title="Aún no tiene un médico asignado." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {asignacionesActivas.map((a) => (
                <Badge key={a.id} tone="blue">
                  {a.doctor.usuario.nombreCompleto} — {a.especialidad.nombre}
                </Badge>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Última consulta" />
        <CardBody className="text-sm text-slate-700">
          {ultimaNota ? (
            <>
              <p className="font-medium">
                {ultimaNota.fechaHora.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })} ·{" "}
                {ultimaNota.asignacion.doctor.usuario.nombreCompleto} ({ultimaNota.asignacion.especialidad.nombre})
              </p>
              {ultimaNota.planTratamiento && (
                <p className="mt-1 text-slate-600">
                  <strong>Indicaciones:</strong> {ultimaNota.planTratamiento}
                </p>
              )}
              <Link href="/portal/consultas" className="mt-2 inline-block text-sm text-blue-700 underline">
                Ver todas las consultas
              </Link>
            </>
          ) : (
            <EmptyState title="Aún no hay consultas registradas." />
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader title="Recetas recientes" />
          <CardBody>
            {recetasRecientes.length === 0 ? (
              <EmptyState title="Sin recetas." />
            ) : (
              <div className="space-y-2">
                {recetasRecientes.map((r) => (
                  <Link key={r.id} href={`/portal/recetas/${r.id}`} className="block text-sm">
                    <span className="font-medium text-blue-700">{r.folio}</span>{" "}
                    <span className="text-slate-500">
                      {r.fechaEmision.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })} · {r.asignacion.doctor.usuario.nombreCompleto}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <Link href="/portal/recetas" className="mt-3 inline-block">
              <Button variant="secondary" size="sm">Ver todas</Button>
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Documentos recientes" />
          <CardBody>
            {documentosRecientes.length === 0 ? (
              <EmptyState title="Sin documentos." />
            ) : (
              <div className="space-y-2">
                {documentosRecientes.map((d) => (
                  <a key={d.id} href={`/api/documentos/${d.id}`} target="_blank" className="block text-sm font-medium text-blue-700 underline">
                    {d.nombreArchivo}
                  </a>
                ))}
              </div>
            )}
            <Link href="/portal/documentos" className="mt-3 inline-block">
              <Button variant="secondary" size="sm">Ver todos</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}


export const dynamic = "force-dynamic";
