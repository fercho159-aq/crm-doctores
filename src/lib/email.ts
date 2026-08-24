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

// Invitación al portal del paciente: envío directo (no usa EmailQueue, que está
// atada a Receta). Best-effort: si falla, el staff puede reenviar la invitación
// desde la ficha del paciente; nunca bloquea la operación que la generó.
export async function enviarInvitacionPortal(destinatario: string, nombrePaciente: string, enlace: string) {
  const transporter = getTransporter();
  if (!transporter) return { ok: false as const, error: "SMTP no configurado (SMTP_HOST, SMTP_USER, SMTP_PASS)" };
  const config = await db.configuracion.findUnique({ where: { id: 1 } });
  const fromEmail = process.env.SMTP_USER ?? "info@novamedics.com.mx";
  const fromName = config?.razonSocial ?? "NovaMedics";
  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: destinatario,
      subject: `Acceso a su portal de paciente — ${fromName}`,
      text: [
        `Estimado(a) ${nombrePaciente}:`,
        ``,
        `Se habilitó su acceso al portal de paciente de ${fromName}.`,
        `Para activar su cuenta y definir su contraseña, ingrese al siguiente enlace (válido 48 horas):`,
        ``,
        enlace,
        ``,
        `Si usted no solicitó este acceso, ignore este mensaje.`,
        `Este correo fue generado automáticamente. No responda a este mensaje.`,
      ].join("\n"),
    });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: String(e instanceof Error ? e.message : e) };
  }
}

export async function enviarBienvenida(email: string, nombre: string) {
  const transporter = getTransporter();
  if (!transporter) return;

  const fromEmail = process.env.SMTP_USER ?? "info@novamedics.com.mx";

  try {
    await transporter.sendMail({
      from: `"NovaMedics" <${fromEmail}>`,
      to: email,
      subject: "Bienvenido a NovaMedics",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
          <div style="text-align:center;margin-bottom:24px">
            <div style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:20px;width:40px;height:40px;line-height:40px;border-radius:10px">N</div>
          </div>
          <h1 style="font-size:22px;color:#1e293b;margin:0 0 8px">Hola Dr(a). ${nombre}</h1>
          <p style="color:#64748b;font-size:15px;line-height:1.6;margin:0 0 20px">
            Tu cuenta en <strong style="color:#1e293b">NovaMedics</strong> fue creada exitosamente.
          </p>
          <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin-bottom:20px">
            <p style="margin:0 0 4px;font-size:13px;color:#64748b">Tu plan actual</p>
            <p style="margin:0;font-size:18px;font-weight:bold;color:#1e293b">Receta — Gratis</p>
          </div>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0 0 24px">
            Ya puedes crear recetas digitales y enviarlas por correo a tus pacientes.
            Completa tu perfil con tu cédula profesional para empezar.
          </p>
          <div style="text-align:center;margin-bottom:24px">
            <a href="https://novamedics.com.mx/mi-consulta" style="display:inline-block;background:#1d4ed8;color:#fff;font-weight:bold;font-size:14px;padding:12px 32px;border-radius:10px;text-decoration:none">
              Ir a mi consultorio
            </a>
          </div>
          <div style="text-align:center;margin-bottom:16px">
            <a href="https://novamedics.com.mx/precios" style="font-size:13px;color:#1d4ed8;text-decoration:none">
              Ver planes disponibles →
            </a>
          </div>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0" />
          <p style="font-size:11px;color:#94a3b8;text-align:center;margin:0">
            NovaMedics — Expediente Clínico Electrónico<br/>
            Conforme a la NOM-004-SSA3-2012
          </p>
        </div>
      `,
    });
  } catch {
    // No bloquear el registro si falla el correo
  }
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
