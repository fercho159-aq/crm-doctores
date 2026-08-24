import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { cargarExpediente } from "../../expediente";
import { CancelarReenviarReceta } from "./Acciones";

export default async function RecetaDetalle({ params }: { params: Promise<{ id: string; recetaId: string }> }) {
  const { id, recetaId } = await params;
  const { user, paciente, miAsignacionActiva } = await cargarExpediente(id, { sinBitacora: true });

  const receta = await db.receta.findUnique({
    where: { id: recetaId },
    include: {
      partidas: { orderBy: { orden: "asc" } },
      documento: true,
      asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } },
      emailQueue: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!receta || receta.asignacion.pacienteId !== id) notFound();

  const esEmisor = miAsignacionActiva?.id === receta.asignacionId;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Receta {receta.folio}</h2>
          <p className="text-sm text-slate-500">
            {receta.asignacion.doctor.usuario.nombreCompleto} · {receta.fechaEmision.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
          </p>
        </div>
        {receta.estado === "CANCELADA" ? (
          <Badge tone="red">CANCELADA</Badge>
        ) : (
          <Badge tone={receta.estadoEnvio === "ENVIADA" ? "green" : receta.estadoEnvio === "ERROR" ? "red" : "amber"}>
            {receta.estadoEnvio === "ENVIADA"
              ? "Enviada"
              : receta.estadoEnvio === "ERROR"
                ? "Error de envío"
                : receta.estadoEnvio === "SIN_CORREO"
                  ? "Sin correo"
                  : "Envío pendiente"}
          </Badge>
        )}
      </div>

      {receta.estado === "CANCELADA" && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          Motivo de cancelación: {receta.motivoCancelacion}
        </div>
      )}

      {/* PDF embebido */}
      {receta.documento && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <iframe
            src={`/api/documentos/${receta.documento.id}`}
            className="h-[700px] w-full"
            title={`Receta ${receta.folio}`}
          />
        </div>
      )}

      {/* 3 botones de acción */}
      {receta.estado === "EMITIDA" && (
        <div className="flex flex-wrap justify-center gap-3">
          {receta.documento && (
            <a
              href={`/api/documentos/${receta.documento.id}`}
              target="_blank"
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Imprimir receta
            </a>
          )}
          <CancelarReenviarReceta
            recetaId={receta.id}
            emailActual={paciente.email}
            puedeCancelar={esEmisor}
            envioFallido={receta.estadoEnvio === "ERROR" || receta.estadoEnvio === "SIN_CORREO"}
          />
        </div>
      )}
    </div>
  );
}
