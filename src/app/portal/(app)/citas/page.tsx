import { db } from "@/lib/db";
import { Card, CardBody, Badge, EmptyState } from "@/components/ui";
import { cargarPacientePropio } from "../paciente";

const ESTADO_TONE: Record<string, "blue" | "green" | "amber" | "red" | "slate"> = {
  PROGRAMADA: "blue",
  REALIZADA: "green",
  NO_ASISTIO: "red",
  REPROGRAMADA: "amber",
  CANCELADA: "slate",
};

const ESTADO_LABEL: Record<string, string> = {
  PROGRAMADA: "Programada",
  REALIZADA: "Realizada",
  NO_ASISTIO: "No asistió",
  REPROGRAMADA: "Reprogramada",
  CANCELADA: "Cancelada",
};

// El sistema hoy solo agenda citas de seguimiento postoperatorio
// (CitaPostoperatoria); no existe una agenda general de consulta que reutilizar
// (§3/§11 del plan). Por eso esta pantalla es de solo lectura y, si el paciente
// no tiene cirugía en curso, no muestra nada que agendar — evita prometer una
// función de "solicitar cita" que el sistema todavía no puede cumplir.
export default async function CitasPortal() {
  const { paciente } = await cargarPacientePropio({ sinBitacora: true });

  const citas = await db.citaPostoperatoria.findMany({
    where: { asignacion: { pacienteId: paciente.id } },
    orderBy: { fechaHoraProgramada: "desc" },
    include: { asignacion: { include: { doctor: { include: { usuario: true } } } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Citas</h1>
      {citas.length === 0 ? (
        <EmptyState title="No tiene citas de seguimiento registradas. Para agendar una consulta, comuníquese con su consultorio." />
      ) : (
        <Card>
          <div className="divide-y divide-slate-100">
            {citas.map((c) => (
              <CardBody key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-800">
                    {c.fechaHoraProgramada.toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "full", timeStyle: "short" })}
                  </p>
                  <p className="text-sm text-slate-500">
                    {c.motivo} · {c.asignacion.doctor.usuario.nombreCompleto}
                  </p>
                </div>
                <Badge tone={ESTADO_TONE[c.estado]}>{ESTADO_LABEL[c.estado]}</Badge>
              </CardBody>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
