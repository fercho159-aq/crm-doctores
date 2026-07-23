import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Badge, Card, CardHeader, CardBody } from "@/components/ui";
import { cargarExpediente } from "../../expediente";
import { NotaPreForm, NotaPostForm, CitasQx } from "./Formularios";

export default async function QxDetalle({ params }: { params: Promise<{ id: string; qxId: string }> }) {
  const { id, qxId } = await params;
  const { miAsignacionActiva } = await cargarExpediente(id, { sinBitacora: true });

  const qx = await db.expedienteQuirurgico.findUnique({
    where: { id: qxId },
    include: {
      asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } },
      notaPre: true,
      notaPost: true,
      citas: { orderBy: { fechaHoraProgramada: "asc" } },
    },
  });
  if (!qx || qx.pacienteId !== id) notFound();

  const esPropio = miAsignacionActiva?.id === qx.asignacionId;

  const preFirmada = qx.notaPre?.estado === "FIRMADA";
  const postFirmada = qx.notaPost?.estado === "FIRMADA";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={`Expediente quirúrgico — ${qx.asignacion.especialidad.nombre}`}
          subtitle={`Cirujano responsable: ${qx.asignacion.doctor.usuario.nombreCompleto}${
            qx.fechaCirugiaProgramada
              ? ` · Programada: ${qx.fechaCirugiaProgramada.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}`
              : ""
          }${qx.quirofanoSede ? ` · ${qx.quirofanoSede}` : ""}`}
          action={<Badge tone={qx.estado === "REALIZADA" ? "green" : "blue"}>{qx.estado}</Badge>}
        />
        <CardBody>
          <p className="text-sm text-slate-500">
            Consentimiento informado: {qx.consentimientoFecha
              ? `recabado el ${qx.consentimientoFecha.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}`
              : "pendiente de registrar (adjunto escaneado — formato MIT «Carta de consentimiento bajo información»)."}
          </p>
        </CardBody>
      </Card>

      <NotaPreForm
        qxId={qx.id}
        editable={esPropio && !preFirmada}
        firmada={!!preFirmada}
        inicial={{
          diagnosticoPreoperatorio: qx.notaPre?.diagnosticoPreoperatorio ?? "",
          planQuirurgico: qx.notaPre?.planQuirurgico ?? "",
          tipoCirugia: qx.notaPre?.tipoCirugia ?? "",
          riesgoQuirurgico: qx.notaPre?.riesgoQuirurgico ?? "",
          cuidadosPlanTerapeutico: qx.notaPre?.cuidadosPlanTerapeutico ?? "",
          pronostico: qx.notaPre?.pronostico ?? "",
        }}
      />

      <NotaPostForm
        qxId={qx.id}
        editable={esPropio && !postFirmada}
        firmada={!!postFirmada}
        inicial={{
          diagnosticoPreoperatorio: qx.notaPost?.diagnosticoPreoperatorio ?? qx.notaPre?.diagnosticoPreoperatorio ?? "",
          operacionPlaneada: qx.notaPost?.operacionPlaneada ?? qx.notaPre?.planQuirurgico ?? "",
          operacionRealizada: qx.notaPost?.operacionRealizada ?? "",
          diagnosticoPostoperatorio: qx.notaPost?.diagnosticoPostoperatorio ?? "",
          descripcionTecnica: qx.notaPost?.descripcionTecnica ?? "",
          hallazgos: qx.notaPost?.hallazgos ?? "",
          conteoGasas: qx.notaPost?.conteoGasas ?? "",
          incidentesAccidentes: qx.notaPost?.incidentesAccidentes ?? "",
          cuantificacionSangrado: qx.notaPost?.cuantificacionSangrado ?? "",
          transfusiones: qx.notaPost?.transfusiones ?? "",
          estudiosTransoperatorios: qx.notaPost?.estudiosTransoperatorios ?? "",
          equipoQuirurgico: qx.notaPost?.equipoQuirurgico ?? "",
          estadoPostquirurgico: qx.notaPost?.estadoPostquirurgico ?? "",
          planManejo: qx.notaPost?.planManejo ?? "",
          pronostico: qx.notaPost?.pronostico ?? "",
          envioPiezasPatologia: qx.notaPost?.envioPiezasPatologia ?? "",
        }}
      />

      <CitasQx
        qxId={qx.id}
        editable={!!esPropio}
        citas={qx.citas.map((c) => ({
          id: c.id,
          fecha: c.fechaHoraProgramada.toLocaleString("es-MX", { timeZone: "America/Mexico_City" }),
          motivo: c.motivo,
          estado: c.estado,
          observaciones: c.observaciones,
        }))}
      />
    </div>
  );
}
