import { notFound } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { HojaForm } from "./HojaForm";

export default async function HojaPage({ params }: { params: Promise<{ pacienteId: string }> }) {
  const user = await requireRole("ENFERMERIA", "ADMIN", "DOCTOR");
  const { pacienteId } = await params;
  const paciente = await db.paciente.findUnique({ where: { id: pacienteId } });
  if (!paciente || paciente.workspaceId !== user.workspaceId) notFound();

  const hoja =
    (await db.hojaPrimerLlenado.findFirst({ where: { pacienteId, estado: "BORRADOR" }, orderBy: { version: "desc" } })) ??
    (await db.hojaPrimerLlenado.findFirst({ where: { pacienteId }, orderBy: { version: "desc" } }));

  // Enfermería (CLINIC) o el propio Doctor (BASIC, sin enfermería) escriben mientras
  // esté en borrador. Admin y Doctor de CLINIC: siempre lectura.
  const puedeEscribir =
    (user.rol === "ENFERMERIA" || (user.rol === "DOCTOR" && user.workspaceTipo === "BASIC")) &&
    hoja?.estado !== "CERRADA";
  const soloLectura = !puedeEscribir;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {!soloLectura && (
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">✓</span>
          <div className="h-0.5 w-8 bg-blue-600" />
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">2</span>
          <p className="ml-2 text-sm text-slate-500">
            Paso 2 de 2 — <strong className="text-slate-700">Hoja clínica y signos vitales</strong>
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Hoja de primer llenado {hoja ? `— v${hoja.version}` : ""}
          </h1>
          <p className="text-slate-500">
            {paciente.nombre} {paciente.apellidoPaterno} {paciente.apellidoMaterno} · {paciente.numeroExpediente}
          </p>
        </div>
        {soloLectura ? <Badge tone="green">Cerrada — solo lectura</Badge> : <Badge tone="amber">Borrador</Badge>}
      </div>
      <HojaForm
        pacienteId={pacienteId}
        sexo={paciente.sexo}
        soloLectura={!!soloLectura}
        inicial={hoja ? {
          motivoConsulta: hoja.motivoConsulta ?? "",
          padecimientoActual: hoja.padecimientoActual ?? "",
          especialidadesSugeridas: hoja.especialidadesSugeridas ?? "",
          antecedentesHeredofamiliares: hoja.antecedentesHeredofamiliares ?? "",
          antecedentesPatologicos: hoja.antecedentesPatologicos ?? "",
          antecedentesNoPatologicos: hoja.antecedentesNoPatologicos ?? "",
          antecedentesGinecoObstetricos: hoja.antecedentesGinecoObstetricos ?? "",
          alergias: hoja.alergias ?? "",
          medicamentosActuales: hoja.medicamentosActuales ?? "",
          interrogatorioAparatos: hoja.interrogatorioAparatos ?? "",
          cirugiaDeseada: hoja.cirugiaDeseada ?? "",
          presupuesto: hoja.presupuesto ?? "",
          fechaProgramadaDeseada: hoja.fechaProgramadaDeseada ?? "",
          taSistolica: hoja.taSistolica?.toString() ?? "",
          taDiastolica: hoja.taDiastolica?.toString() ?? "",
          fc: hoja.fc?.toString() ?? "",
          fr: hoja.fr?.toString() ?? "",
          temperatura: hoja.temperatura?.toString() ?? "",
          pesoKg: hoja.pesoKg?.toString() ?? "",
          tallaCm: hoja.tallaCm?.toString() ?? "",
          spo2: hoja.spo2?.toString() ?? "",
          glucosa: hoja.glucosa?.toString() ?? "",
          escalaDolor: hoja.escalaDolor?.toString() ?? "",
          observacionesEnfermeria: hoja.observacionesEnfermeria ?? "",
        } : undefined}
      />
    </div>
  );
}
