import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, EmptyState, Badge, Input, Button } from "@/components/ui";
import { TomarPacienteForm } from "./TomarPacienteForm";

export default async function Disponibles({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireRole("DOCTOR");
  const doctorId = user.doctorId!;
  const { q } = await searchParams;

  const [misEspecialidades, hojas] = await Promise.all([
    db.doctorEspecialidad.findMany({ where: { doctorId }, include: { especialidad: true } }),
    db.hojaPrimerLlenado.findMany({
      where: {
        disponibleConsulta: true,
        estado: "CERRADA",
        paciente: {
          activo: true,
          ...(q
            ? {
                OR: [
                  { nombre: { contains: q, mode: "insensitive" as const } },
                  { apellidoPaterno: { contains: q, mode: "insensitive" as const } },
                  { numeroExpediente: { contains: q, mode: "insensitive" as const } },
                ],
              }
            : {}),
        },
      },
      include: { paciente: { include: { asignaciones: { where: { estado: "ACTIVA" }, include: { especialidad: true } } } } },
      orderBy: { fechaCierre: "desc" },
      take: 50,
    }),
  ]);

  const especialidades = misEspecialidades.map((de) => de.especialidad);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Pacientes disponibles para consulta</h1>

      <form className="flex max-w-md gap-2" action="/mi-consulta/disponibles" method="GET">
        <Input name="q" defaultValue={q} placeholder="Buscar por nombre o expediente…" />
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>

      <Card>
        <CardHeader
          title="En espera"
          subtitle="Abra la hoja en lectura y tome al paciente con una de sus especialidades. Otras especialidades pueden tomarlo en paralelo."
        />
        <CardBody>
          {hojas.length === 0 ? (
            <EmptyState title="No hay pacientes en espera." />
          ) : (
            <div className="divide-y divide-slate-100">
              {hojas.map((h) => (
                <div key={h.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800">
                      {h.paciente.nombre} {h.paciente.apellidoPaterno} {h.paciente.apellidoMaterno}
                    </p>
                    <p className="text-sm text-slate-500">
                      {h.paciente.numeroExpediente} · Motivo: {h.motivoConsulta ?? "—"}
                      {h.especialidadesSugeridas ? ` · Sugerida: ${h.especialidadesSugeridas}` : ""}
                    </p>
                    {h.alergias && h.alergias.toUpperCase() !== "NINGUNA CONOCIDA" && (
                      <Badge tone="red">Alergias: {h.alergias}</Badge>
                    )}
                    {h.paciente.asignaciones.length > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        Ya en atención: {h.paciente.asignaciones.map((a) => a.especialidad.nombre).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/enfermeria/hoja/${h.pacienteId}`} className="text-sm text-blue-700 underline">
                      Ver hoja
                    </Link>
                    <TomarPacienteForm pacienteId={h.pacienteId} especialidades={especialidades} />
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
