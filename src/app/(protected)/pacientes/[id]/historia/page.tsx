import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, EmptyState, Button, Badge } from "@/components/ui";
import { cargarExpediente } from "../expediente";
import { generarHistoriaClinica } from "@/actions/formatos";
import { RevisarAportacionForm } from "./RevisarAportacionForm";

const CATEGORIA_LABEL: Record<string, string> = {
  ALERGIA: "Alergia",
  MEDICAMENTO: "Medicamento actual",
  ANTECEDENTE: "Antecedente",
  SINTOMA: "Síntoma",
  OBSERVACION: "Observación",
  PRECONSULTA: "Antes de consulta",
};

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="whitespace-pre-wrap text-slate-800">{valor}</p>
    </div>
  );
}

export default async function HistoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { miAsignacionActiva } = await cargarExpediente(id, { sinBitacora: true });

  const [hojas, aportacionesPendientes] = await Promise.all([
    db.hojaPrimerLlenado.findMany({
      where: { pacienteId: id, estado: "CERRADA" },
      include: { capturadoPor: true },
      orderBy: { version: "desc" },
    }),
    db.aportacionPaciente.findMany({
      where: { pacienteId: id, estado: "PENDIENTE_REVISION" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-4">
      {aportacionesPendientes.length > 0 && (
        <Card>
          <CardHeader
            title="Información proporcionada por el paciente"
            subtitle="No es una nota médica firmada. Revise y decida si la incorpora a su propia nota."
          />
          <CardBody className="space-y-3">
            {aportacionesPendientes.map((a) => (
              <div key={a.id} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="amber">{CATEGORIA_LABEL[a.categoria] ?? a.categoria}</Badge>
                  <span className="text-xs text-slate-500">
                    {a.createdAt.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-800">{a.contenido}</p>
                {miAsignacionActiva && (
                  <RevisarAportacionForm aportacionId={a.id} asignacionId={miAsignacionActiva.id} />
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {hojas.length === 0 ? (
        <EmptyState title="Aún no hay historia clínica cerrada para este paciente." />
      ) : (
      <div className="space-y-4">
      <div className="flex justify-end">
        <form action={generarHistoriaClinica.bind(null, id) as unknown as (fd: FormData) => Promise<void>}>
          <Button type="submit" variant="secondary" size="sm">
            Generar PDF de historia clínica (formato MIT)
          </Button>
        </form>
      </div>
      {hojas.map((h, i) => (
        <Card key={h.id}>
          <CardHeader
            title={`Historia clínica de ingreso — versión ${h.version}${i === 0 ? " (vigente)" : ""}`}
            subtitle={`Capturó ${h.capturadoPor.nombreCompleto} · ${h.fechaHoraCaptura.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}`}
          />
          <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Campo label="Motivo de consulta" valor={h.motivoConsulta} />
            <Campo label="Padecimiento actual" valor={h.padecimientoActual} />
            <Campo label="Antecedentes heredofamiliares" valor={h.antecedentesHeredofamiliares} />
            <Campo label="Personales patológicos" valor={h.antecedentesPatologicos} />
            <Campo label="Personales no patológicos" valor={h.antecedentesNoPatologicos} />
            <Campo label="Gineco-obstétricos" valor={h.antecedentesGinecoObstetricos} />
            <div className="rounded-lg bg-red-50 p-2">
              <Campo label="Alergias" valor={h.alergias} />
            </div>
            <Campo label="Medicamentos actuales" valor={h.medicamentosActuales} />
            <Campo label="Interrogatorio por aparatos y sistemas" valor={h.interrogatorioAparatos} />
            <Campo label="Cirugía deseada" valor={h.cirugiaDeseada} />
            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Signos vitales y somatometría</p>
              <p className="text-slate-800">
                TA {h.taSistolica ?? "—"}/{h.taDiastolica ?? "—"} mmHg · FC {h.fc ?? "—"} lpm · FR {h.fr ?? "—"} rpm ·
                Temp {h.temperatura?.toString() ?? "—"} °C · SpO2 {h.spo2 ?? "—"}% · Peso {h.pesoKg?.toString() ?? "—"} kg ·
                Talla {h.tallaCm?.toString() ?? "—"} cm
                {h.pesoKg && h.tallaCm
                  ? ` · IMC ${(Number(h.pesoKg) / Math.pow(Number(h.tallaCm) / 100, 2)).toFixed(1)}`
                  : ""}
              </p>
            </div>
            <Campo label="Observaciones de enfermería" valor={h.observacionesEnfermeria} />
          </CardBody>
        </Card>
      ))}
      </div>
      )}
    </div>
  );
}
