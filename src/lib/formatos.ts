import "server-only";
import { db } from "./db";
import { edadDe } from "./pdf";
import type { Establecimiento, PacientePdf } from "@/pdf/formatos";
import type { Paciente } from "@prisma/client";

// Datos comunes a todos los formatos: encabezado del establecimiento y ficha del
// paciente. Los generadores de PDF (recetas, quirúrgico, consumo, anestesiología)
// parten siempre de aquí para que las hojas salgan con la misma identidad.

export const sexoLabel = (s: string) => (s === "M" ? "Masculino" : s === "F" ? "Femenino" : "Otro");

export const fmt = (d: Date) =>
  d.toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short", timeZone: "America/Mexico_City" });

export const fmtFecha = (d: Date) =>
  d.toLocaleDateString("es-MX", { dateStyle: "long", timeZone: "America/Mexico_City" });

export const fmtFechaCorta = (d: Date) =>
  d.toLocaleDateString("es-MX", { day: "2-digit", month: "2-digit", year: "2-digit", timeZone: "America/Mexico_City" });

export const fmtHora = (d: Date) =>
  d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });

/** Un decimal de Prisma tal como debe salir impreso, o `null` si no se capturó. */
export const dec = (v: { toString(): string } | null | undefined) => (v === null || v === undefined ? null : v.toString());

export async function cargarEstablecimiento(): Promise<Establecimiento> {
  const c = await db.configuracion.findUniqueOrThrow({ where: { id: 1 } });
  return {
    razonSocial: c.razonSocial,
    domicilio: c.domicilio,
    telefono: c.telefono,
    logotipo: c.logotipo,
    licenciaSanitaria: c.licenciaSanitaria,
    rfc: c.rfc,
    expedienteCofepris: c.expedienteCofepris,
    oficioCofepris: c.oficioCofepris,
  };
}

export function pacientePdf(p: Paciente): PacientePdf {
  return {
    nombre: `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno ?? ""}`.trim(),
    expediente: p.numeroExpediente,
    edad: edadDe(p.fechaNacimiento),
    sexo: sexoLabel(p.sexo),
    fechaNacimiento: p.fechaNacimiento.toLocaleDateString("es-MX", { timeZone: "UTC" }),
    domicilio: [p.calle, p.colonia, p.municipio, p.estado, p.cp].filter(Boolean).join(", ") || null,
    telefono: p.telefono,
  };
}
