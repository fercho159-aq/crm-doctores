import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge, EmptyState } from "@/components/ui";
import { cargarPacientePropio } from "../paciente";
import { SubirDocumentoPropioForm } from "./SubirDocumentoPropioForm";

const TIPO: Record<string, { label: string; tone: "blue" | "green" | "amber" | "slate" }> = {
  RECETA: { label: "Receta", tone: "blue" },
  CONSENTIMIENTO: { label: "Consentimiento / contrato", tone: "green" },
  ESTUDIO: { label: "Estudio", tone: "amber" },
  RESUMEN_CLINICO: { label: "Resumen clínico", tone: "slate" },
  OTRO: { label: "Otro", tone: "slate" },
};

export default async function MisDocumentos() {
  const { paciente } = await cargarPacientePropio({ sinBitacora: true });

  const documentos = await db.documento.findMany({
    where: { pacienteId: paciente.id },
    orderBy: { fecha: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Mis documentos</h1>

      <Card>
        <CardHeader
          title="Documentos de su expediente"
          subtitle="PDFs generados por el consultorio y lo que usted mismo ha subido."
        />
        <CardBody>
          {documentos.length === 0 ? (
            <EmptyState title="Aún no hay documentos." />
          ) : (
            <div className="divide-y divide-slate-100">
              {documentos.map((d) => (
                <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <a href={`/api/documentos/${d.id}`} target="_blank" className="font-medium text-blue-700 underline">
                      {d.nombreArchivo}
                    </a>
                    <p className="text-sm text-slate-500">
                      {d.fecha.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
                      {d.origen === "PACIENTE" ? " · subido por usted" : " · subido por el consultorio"}
                    </p>
                  </div>
                  <Badge tone={TIPO[d.tipo]?.tone ?? "slate"}>{TIPO[d.tipo]?.label ?? d.tipo}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Subir un documento" subtitle="Estudios, resultados de laboratorio u otros documentos. PDF o imagen, máximo 10 MB." />
        <CardBody>
          <SubirDocumentoPropioForm />
        </CardBody>
      </Card>
    </div>
  );
}
