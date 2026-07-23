import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, EmptyState, Button } from "@/components/ui";
import { cargarExpediente } from "../expediente";
import { generarHistoriaClinica } from "@/actions/formatos";

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
  await cargarExpediente(id, { sinBitacora: true });

  const hojas = await db.hojaPrimerLlenado.findMany({
    where: { pacienteId: id, estado: "CERRADA" },
    include: { capturadoPor: true },
    orderBy: { version: "desc" },
  });

  if (hojas.length === 0) {
    return <EmptyState title="Aún no hay historia clínica cerrada para este paciente." />;
  }

  return (
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
  );
}
