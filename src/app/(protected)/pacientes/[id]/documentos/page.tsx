import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { cargarExpediente } from "../expediente";
import { SubirDocumentoForm } from "./SubirDocumentoForm";

const TIPO: Record<string, { label: string; tone: "blue" | "green" | "amber" | "slate" }> = {
  RECETA: { label: "Receta", tone: "blue" },
  CONSENTIMIENTO: { label: "Consentimiento / contrato", tone: "green" },
  ESTUDIO: { label: "Estudio", tone: "amber" },
  RESUMEN_CLINICO: { label: "Resumen clínico", tone: "slate" },
  OTRO: { label: "Otro", tone: "slate" },
};

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, miAsignacionActiva } = await cargarExpediente(id, { sinBitacora: true });

  const documentos = await db.documento.findMany({
    where: { pacienteId: id },
    orderBy: { fecha: "desc" },
  });
  const autores = await db.usuario.findMany({
    where: { id: { in: [...new Set(documentos.map((d) => d.subidoPorId))] } },
    select: { id: true, nombreCompleto: true },
  });
  const autor = (uid: string) => autores.find((a) => a.id === uid)?.nombreCompleto ?? "—";

  const puedeSubir = user.rol === "ADMIN" || !!miAsignacionActiva;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Documentos del expediente"
          subtitle="PDFs generados por el sistema y adjuntos escaneados (consentimientos, contratos, estudios). Integridad verificada con SHA-256."
        />
        <CardBody>
          {documentos.length === 0 ? (
            <EmptyState title="Este paciente aún no tiene documentos." />
          ) : (
            <div className="divide-y divide-slate-100">
              {documentos.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <a
                      href={`/api/documentos/${d.id}`}
                      target="_blank"
                      className="font-medium text-blue-700 underline"
                    >
                      {d.nombreArchivo}
                    </a>
                    <p className="text-sm text-slate-500">
                      {d.fecha.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })} · subió {autor(d.subidoPorId)}
                    </p>
                    <p className="text-xs text-slate-400">SHA-256 {d.hashSha256.slice(0, 24)}…</p>
                  </div>
                  <Badge tone={TIPO[d.tipo]?.tone ?? "slate"}>{TIPO[d.tipo]?.label ?? d.tipo}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {puedeSubir && (
        <Card>
          <CardHeader title="Adjuntar documento escaneado" subtitle="PDF o imagen, máximo 10 MB." />
          <CardBody>
            <SubirDocumentoForm pacienteId={id} />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
