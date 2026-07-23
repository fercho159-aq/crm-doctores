import "server-only";
import { Resend } from "resend";
import { readFile } from "fs/promises";
import { db } from "./db";
import { audit } from "./audit";

// Envío asíncrono: la receta se encola al firmar y el cron procesa con
// reintentos (1 min, 10 min, 1 h). Un fallo de correo nunca bloquea la consulta.

const RETRY_DELAYS_MS = [60_000, 600_000, 3_600_000];
const MAX_INTENTOS = 3;

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function encolarReceta(recetaId: string, destinatario: string) {
  await db.emailQueue.create({
    data: { recetaId, destinatario },
  });
}

export async function procesarColaCorreo(): Promise<{ procesados: number; enviados: number; fallidos: number }> {
  const pendientes = await db.emailQueue.findMany({
    where: { estado: "PENDIENTE", proximoIntento: { lte: new Date() } },
    include: {
      receta: {
        include: {
          documento: true,
          asignacion: { include: { doctor: { include: { usuario: true } }, paciente: true } },
        },
      },
    },
    take: 20,
  });

  const resend = getResend();
  const config = await db.configuracion.findUnique({ where: { id: 1 } });
  let enviados = 0, fallidos = 0;

  for (const item of pendientes) {
    const receta = item.receta;
    if (!resend) {
      await db.emailQueue.update({
        where: { id: item.id },
        data: { ultimoError: "RESEND_API_KEY no configurada", proximoIntento: new Date(Date.now() + 3_600_000) },
      });
      continue;
    }
    try {
      let attachment: { filename: string; content: Buffer }[] = [];
      if (receta.documento) {
        const content = await readFile(receta.documento.ruta);
        attachment = [{ filename: receta.documento.nombreArchivo, content }];
      }
      const doctorNombre = receta.asignacion.doctor.usuario.nombreCompleto;
      // Minimización de datos: el cuerpo no reproduce el detalle clínico.
      const { error } = await resend.emails.send({
        from: config?.emailRemitente ?? "onboarding@resend.dev",
        to: item.destinatario,
        subject: `Su receta médica — ${config?.razonSocial ?? "MIT Medical Tower"}`,
        text: [
          `Estimado(a) paciente:`,
          ``,
          `Le enviamos adjunta su receta médica (folio ${receta.folio}) emitida por ${doctorNombre}.`,
          ``,
          `Este correo fue generado automáticamente por el sistema de ${config?.razonSocial ?? "MIT Medical Tower"}. No responda a este mensaje.`,
        ].join("\n"),
        attachments: attachment,
      });
      if (error) throw new Error(error.message);

      await db.$transaction([
        db.emailQueue.update({ where: { id: item.id }, data: { estado: "ENVIADO", intentos: item.intentos + 1 } }),
        db.receta.update({ where: { id: receta.id }, data: { estadoEnvio: "ENVIADA", fechaEnvioEmail: new Date() } }),
      ]);
      await audit({
        accion: "ENVIAR_RECETA", entidad: "receta", entidadId: receta.id,
        pacienteId: receta.asignacion.pacienteId,
        datosDespues: { destinatario: item.destinatario, resultado: "ENVIADA" },
      });
      enviados++;
    } catch (e) {
      const intentos = item.intentos + 1;
      const definitivo = intentos >= MAX_INTENTOS;
      await db.$transaction([
        db.emailQueue.update({
          where: { id: item.id },
          data: {
            intentos,
            estado: definitivo ? "FALLIDO" : "PENDIENTE",
            ultimoError: String(e instanceof Error ? e.message : e),
            proximoIntento: new Date(Date.now() + (RETRY_DELAYS_MS[intentos - 1] ?? RETRY_DELAYS_MS[2])),
          },
        }),
        ...(definitivo
          ? [db.receta.update({ where: { id: receta.id }, data: { estadoEnvio: "ERROR" as const } })]
          : []),
      ]);
      await audit({
        accion: "ENVIAR_RECETA", entidad: "receta", entidadId: receta.id,
        pacienteId: receta.asignacion.pacienteId,
        datosDespues: { destinatario: item.destinatario, resultado: definitivo ? "FALLIDO" : "REINTENTO", error: String(e) },
      });
      fallidos++;
    }
  }
  return { procesados: pendientes.length, enviados, fallidos };
}

export async function reintentarEnvio(recetaId: string, destinatario: string) {
  await db.$transaction([
    db.emailQueue.updateMany({
      where: { recetaId, estado: "FALLIDO" },
      data: { estado: "PENDIENTE", intentos: 0, proximoIntento: new Date(), destinatario },
    }),
    db.receta.update({ where: { id: recetaId }, data: { estadoEnvio: "PENDIENTE" } }),
  ]);
}
