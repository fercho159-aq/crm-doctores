import "server-only";
import { createTransport } from "nodemailer";
import { readFile } from "fs/promises";
import { db } from "./db";
import { audit } from "./audit";

// Envío asíncrono: la receta se encola al firmar y el cron procesa con
// reintentos (1 min, 10 min, 1 h). Un fallo de correo nunca bloquea la consulta.

const RETRY_DELAYS_MS = [60_000, 600_000, 3_600_000];
const MAX_INTENTOS = 3;

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? "465"),
    secure: true,
    auth: { user, pass },
  });
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

  const transporter = getTransporter();
  const config = await db.configuracion.findUnique({ where: { id: 1 } });
  const fromEmail = process.env.SMTP_USER ?? "info@novamedics.com.mx";
  const fromName = config?.razonSocial ?? "NovaMedics";
  let enviados = 0, fallidos = 0;

  for (const item of pendientes) {
    const receta = item.receta;
    if (!transporter) {
      await db.emailQueue.update({
        where: { id: item.id },
        data: { ultimoError: "SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASS)", proximoIntento: new Date(Date.now() + 3_600_000) },
      });
      continue;
    }
    try {
      const attachments: { filename: string; content: Buffer }[] = [];
      if (receta.documento) {
        const content = await readFile(receta.documento.ruta);
        attachments.push({ filename: receta.documento.nombreArchivo, content });
      }
      const doctorNombre = receta.asignacion.doctor.usuario.nombreCompleto;

      await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: item.destinatario,
        subject: `Su receta médica — ${fromName}`,
        text: [
          `Estimado(a) paciente:`,
          ``,
          `Le enviamos adjunta su receta médica (folio ${receta.folio}) emitida por ${doctorNombre}.`,
          ``,
          `Este correo fue generado automáticamente por el sistema de ${fromName}. No responda a este mensaje.`,
        ].join("\n"),
        attachments,
      });

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
