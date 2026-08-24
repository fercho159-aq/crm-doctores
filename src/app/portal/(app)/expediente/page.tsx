import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { cargarPacientePropio } from "../paciente";
import { AportarForm } from "./AportarForm";

const CATEGORIA_LABEL: Record<string, string> = {
  ALERGIA: "Alergia",
  MEDICAMENTO: "Medicamento actual",
  ANTECEDENTE: "Antecedente",
  SINTOMA: "Síntoma",
  OBSERVACION: "Observación",
  PRECONSULTA: "Antes de mi próxima consulta",
};

const ESTADO_TONE: Record<string, "amber" | "green" | "red"> = {
  PENDIENTE_REVISION: "amber",
  INCORPORADA: "green",
  RECHAZADA: "red",
};

const ESTADO_LABEL: Record<string, string> = {
  PENDIENTE_REVISION: "En revisión",
  INCORPORADA: "Incorporada por su médico",
  RECHAZADA: "No incorporada",
};

export default async function ExpedientePortal() {
  const { paciente } = await cargarPacientePropio({ sinBitacora: true });

  const [ultimaHoja, aportaciones] = await Promise.all([
    db.hojaPrimerLlenado.findFirst({
      where: { pacienteId: paciente.id, estado: "CERRADA" },
      orderBy: { version: "desc" },
    }),
    db.aportacionPaciente.findMany({
      where: { pacienteId: paciente.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Mi expediente</h1>

      <Card>
        <CardHeader
          title="Información validada por su médico"
          subtitle="Registrada durante su primer llenado. Solo su consultorio puede corregirla."
        />
        <CardBody className="space-y-3 text-sm text-slate-700">
          {ultimaHoja ? (
            <>
              <div className="rounded-lg bg-red-50 p-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-400">Alergias</p>
                <p>{ultimaHoja.alergias || "No registradas"}</p>
              </div>
              {ultimaHoja.medicamentosActuales && (
                <p><strong>Medicamentos actuales:</strong> {ultimaHoja.medicamentosActuales}</p>
              )}
              {ultimaHoja.antecedentesPatologicos && (
                <p><strong>Antecedentes personales patológicos:</strong> {ultimaHoja.antecedentesPatologicos}</p>
              )}
              {ultimaHoja.antecedentesHeredofamiliares && (
                <p><strong>Antecedentes heredofamiliares:</strong> {ultimaHoja.antecedentesHeredofamiliares}</p>
              )}
            </>
          ) : (
            <EmptyState title="Aún no hay historia clínica capturada por el consultorio." />
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Información aportada por usted"
          subtitle="Su médico la revisa antes de incorporarla al expediente; no reemplaza lo ya validado."
        />
        <CardBody className="space-y-3">
          {aportaciones.length === 0 ? (
            <EmptyState title="Aún no ha reportado información adicional." />
          ) : (
            <div className="divide-y divide-slate-100">
              {aportaciones.map((a) => (
                <div key={a.id} className="flex flex-wrap items-start justify-between gap-2 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {CATEGORIA_LABEL[a.categoria] ?? a.categoria}
                    </p>
                    <p className="text-sm text-slate-700">{a.contenido}</p>
                    <p className="text-xs text-slate-400">
                      {a.createdAt.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}
                    </p>
                  </div>
                  <Badge tone={ESTADO_TONE[a.estado]}>{ESTADO_LABEL[a.estado]}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Reportar información nueva" />
        <CardBody>
          <AportarForm />
        </CardBody>
      </Card>
    </div>
  );
}
