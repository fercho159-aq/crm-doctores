import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, Button, EmptyState } from "@/components/ui";
import { cargarExpediente } from "./expediente";
import { AltaForm } from "./AltaForm";
import { FichaIdentificacionForm } from "./FichaIdentificacionForm";

const ESTADO_ASIG: Record<string, { label: string; tone: "blue" | "green" | "slate" | "red" }> = {
  ACTIVA: { label: "Activa", tone: "blue" },
  ALTA: { label: "Alta", tone: "green" },
  REFERIDA: { label: "Referida", tone: "slate" },
  CANCELADA: { label: "Cancelada", tone: "red" },
};

export default async function ResumenPaciente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, paciente, miAsignacionActiva } = await cargarExpediente(id);

  const [notas, recetas, cirugias] = await Promise.all([
    db.notaEvolucion.count({ where: { asignacion: { pacienteId: id }, estado: "FIRMADA" } }),
    db.receta.count({ where: { asignacion: { pacienteId: id }, estado: "EMITIDA" } }),
    db.expedienteQuirurgico.count({ where: { pacienteId: id } }),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
      <Card>
        <CardHeader title="Episodios de atención" subtitle="Expediente único: cada especialidad con su propio ciclo de vida." />
        <CardBody>
          {paciente.asignaciones.length === 0 ? (
            <EmptyState title="Sin episodios de atención todavía." />
          ) : (
            <div className="divide-y divide-slate-100">
              {paciente.asignaciones.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {a.especialidad.nombre} — {a.doctor.usuario.nombreCompleto}
                    </p>
                    <p className="text-sm text-slate-500">
                      Desde {a.fechaAsignacion.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}
                      {a.fechaCierre ? ` · cierre ${a.fechaCierre.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}` : ""}
                      {a.motivo ? ` · ${a.motivo}` : ""}
                    </p>
                  </div>
                  <Badge tone={ESTADO_ASIG[a.estado].tone}>{ESTADO_ASIG[a.estado].label}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <FichaIdentificacionForm
        pacienteId={id}
        responsable={{
          nombre: paciente.contactoEmergenciaNombre ?? "",
          parentesco: paciente.contactoEmergenciaParentesco ?? "",
          telefono: paciente.contactoEmergenciaTelefono ?? "",
        }}
      />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Actividad" />
          <CardBody className="space-y-2 text-sm text-slate-600">
            {user.workspaceTipo !== "BASIC" && (
              <p>Notas de evolución firmadas: <strong>{notas}</strong></p>
            )}
            <p>Recetas emitidas: <strong>{recetas}</strong></p>
            {user.workspaceTipo !== "BASIC" && (
              <p>Expedientes quirúrgicos: <strong>{cirugias}</strong></p>
            )}
          </CardBody>
        </Card>

        {miAsignacionActiva && (
          <Card>
            <CardHeader title="Acciones" />
            <CardBody className="space-y-3">
              {user.workspaceTipo === "BASIC" ? (
                <>
                  <Link href={`/pacientes/${id}/consulta-rapida`} className="block">
                    <Button className="w-full">Nueva consulta</Button>
                  </Link>
                  <Link href={`/pacientes/${id}/recetas`} className="block">
                    <Button className="w-full" variant="secondary">Ver recetas</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href={`/pacientes/${id}/notas?nueva=1`} className="block">
                    <Button className="w-full">Nueva nota de evolución</Button>
                  </Link>
                  <Link href={`/pacientes/${id}/recetas/nueva`} className="block">
                    <Button className="w-full" variant="secondary">Nueva receta</Button>
                  </Link>
                  <Link href={`/pacientes/${id}/cirugias?nuevo=1`} className="block">
                    <Button className="w-full" variant="secondary">Iniciar expediente quirúrgico</Button>
                  </Link>
                  <AltaForm asignacionId={miAsignacionActiva.id} />
                </>
              )}
            </CardBody>
          </Card>
        )}
        {user.rol === "ADMIN" && (
          <p className="text-xs text-slate-400">Acceso de administrador: solo lectura (supervisión).</p>
        )}
      </div>
    </div>
  );
}
