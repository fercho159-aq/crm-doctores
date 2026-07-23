import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Badge } from "@/components/ui";
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
    <div className="mx-auto max-w-3xl space-y-4">
      <Card>
        <CardHeader
          title={`Receta ${receta.folio}`}
          subtitle={`${receta.asignacion.doctor.usuario.nombreCompleto} (${receta.asignacion.especialidad.nombre}) · ${receta.fechaEmision.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}`}
          action={
            receta.estado === "CANCELADA" ? (
              <Badge tone="red">CANCELADA</Badge>
            ) : (
              <Badge tone={receta.estadoEnvio === "ENVIADA" ? "green" : receta.estadoEnvio === "ERROR" ? "red" : "amber"}>
                {receta.estadoEnvio === "ENVIADA"
                  ? `Enviada ${receta.fechaEnvioEmail?.toLocaleString("es-MX", { timeZone: "America/Mexico_City" }) ?? ""}`
                  : receta.estadoEnvio === "ERROR"
                    ? "Error de envío"
                    : receta.estadoEnvio === "SIN_CORREO"
                      ? "Sin correo"
                      : "Envío pendiente"}
              </Badge>
            )
          }
        />
        <CardBody className="space-y-3 text-sm">
          {receta.estado === "CANCELADA" && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-red-800">
              Motivo de cancelación: {receta.motivoCancelacion}
            </div>
          )}
          {receta.diagnostico && <p><strong>Diagnóstico:</strong> {receta.diagnostico}</p>}
          <div className="divide-y divide-slate-100">
            {receta.partidas.map((p) => (
              <div key={p.id} className="py-2">
                <p className="font-medium text-slate-800">
                  {p.orden}. {p.medicamento} {p.presentacion ? `— ${p.presentacion}` : ""} {p.cantidad ? `(${p.cantidad})` : ""}
                </p>
                <p className="text-slate-600">
                  {p.dosis} · {p.viaAdministracion} · {p.frecuencia} · {p.duracion}
                </p>
                {p.indicaciones && <p className="text-slate-500">{p.indicaciones}</p>}
              </div>
            ))}
          </div>
          {receta.indicacionesGenerales && <p><strong>Indicaciones generales:</strong> {receta.indicacionesGenerales}</p>}
          {receta.documento && (
            <p>
              <a href={`/api/documentos/${receta.documento.id}`} target="_blank" className="font-medium text-blue-700 underline">
                Descargar / imprimir PDF
              </a>
              <span className="ml-2 text-xs text-slate-400">SHA-256 {receta.documento.hashSha256.slice(0, 16)}…</span>
            </p>
          )}
          {receta.emailQueue.length > 0 && (
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="mb-1 font-semibold text-slate-600">Historial de envío</p>
              {receta.emailQueue.map((eq) => (
                <p key={eq.id} className="text-xs text-slate-500">
                  {eq.destinatario} · intentos {eq.intentos} · {eq.estado}
                  {eq.ultimoError ? ` · ${eq.ultimoError}` : ""}
                </p>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {(esEmisor || user.rol === "ADMIN") && receta.estado === "EMITIDA" && (
        <CancelarReenviarReceta
          recetaId={receta.id}
          emailActual={paciente.email}
          puedeCancelar={esEmisor}
          envioFallido={receta.estadoEnvio === "ERROR" || receta.estadoEnvio === "SIN_CORREO"}
        />
      )}
    </div>
  );
}
