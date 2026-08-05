"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import React from "react";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole, AuthzError } from "@/lib/authz";
import { audit } from "@/lib/audit";
import { guardarFormatoPdf } from "@/lib/pdf";
import { cargarEstablecimiento, pacientePdf, fmt, fmtFecha, fmtFechaCorta } from "@/lib/formatos";
import { ConsumoQuirofanoPdf, ConsumoPisoPdf, type RenglonConsumo } from "@/pdf/consumo";
import type { ActionState } from "./auth";
import type { CategoriaInsumo, TipoConsumo } from "@prisma/client";

// Hojas oficiales 11-14. Enfermería registra las piezas consumidas; la
// administración captura los precios y cierra la hoja para generar la cuenta.
// Al cerrarse la hoja queda inmutable (trigger `trg_inmutable_hoja_consumo`).

const num = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const decimal = (n: number) => new Prisma.Decimal(n.toFixed(2));

async function contextoConsumo(pacienteId: string, escritura: boolean) {
  const user = escritura
    ? await requireRole("ENFERMERIA", "ADMIN", "DOCTOR")
    : await requireRole("ENFERMERIA", "ADMIN", "DOCTOR", "ANESTESIOLOGO");
  const paciente = await db.paciente.findUniqueOrThrow({ where: { id: pacienteId } });
  return { user, paciente };
}

// ── Alta de la hoja ─────────────────────────────────────────────────────

const cabeceraSchema = z.object({
  tipo: z.enum(["QUIROFANO", "PISO"]),
  expedienteQxId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  cuarto: z.string().optional(),
  tratamiento: z.string().optional(),
  procedimiento: z.string().optional(),
  fechaIngreso: z.string().optional(),
  fechaEgreso: z.string().optional(),
  horaIngresoQuirofano: z.string().optional(),
  horaTerminoQuirofano: z.string().optional(),
  turno: z.string().optional(),
  medicoPediatra: z.string().optional(),
  medicoTratante: z.string().optional(),
  medicoCirujano: z.string().optional(),
  medicoAnestesiologo: z.string().optional(),
  medicoAyudante: z.string().optional(),
  enfermera: z.string().optional(),
  instrumentista: z.string().optional(),
});

export async function crearHojaConsumo(pacienteId: string, _p: ActionState, fd: FormData): Promise<ActionState | void> {
  let ctx;
  try {
    ctx = await contextoConsumo(pacienteId, true);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const parsed = cabeceraSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  const hoja = await db.hojaConsumo.create({
    data: {
      pacienteId,
      tipo: d.tipo as TipoConsumo,
      expedienteQxId: d.expedienteQxId ?? null,
      cuarto: d.cuarto || null,
      tratamiento: d.tratamiento || null,
      procedimiento: d.procedimiento || null,
      fechaIngreso: d.fechaIngreso ? new Date(d.fechaIngreso) : null,
      fechaEgreso: d.fechaEgreso ? new Date(d.fechaEgreso) : null,
      horaIngresoQuirofano: d.horaIngresoQuirofano || null,
      horaTerminoQuirofano: d.horaTerminoQuirofano || null,
      turno: d.turno || null,
      medicoPediatra: d.medicoPediatra || null,
      medicoTratante: d.medicoTratante || null,
      medicoCirujano: d.medicoCirujano || null,
      medicoAnestesiologo: d.medicoAnestesiologo || null,
      medicoAyudante: d.medicoAyudante || null,
      enfermera: d.enfermera || null,
      instrumentista: d.instrumentista || null,
      capturadoPorId: ctx.user.id,
    },
  });
  await audit({
    usuarioId: ctx.user.id, rol: ctx.user.rol, accion: "CREAR", entidad: "hoja_consumo",
    entidadId: hoja.id, pacienteId, datosDespues: { tipo: d.tipo },
  });
  redirect(`/pacientes/${pacienteId}/consumo/${hoja.id}`);
}

// ── Captura de renglones ────────────────────────────────────────────────

/**
 * Agrega o actualiza un renglón. Enfermería envía cantidad; administración
 * envía precio. El importe siempre se recalcula en el servidor para que la
 * cuenta no dependa de lo que llegue del navegador.
 */
export async function guardarRenglonConsumo(hojaId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const hoja = await db.hojaConsumo.findUnique({ where: { id: hojaId } });
  if (!hoja) return { error: "Hoja de consumo no encontrada." };
  if (hoja.estado === "CERRADA") return { error: "La hoja está cerrada: es inmutable." };
  let ctx;
  try {
    ctx = await contextoConsumo(hoja.pacienteId, true);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }

  const partidaId = String(fd.get("partidaId") ?? "");
  const insumoId = String(fd.get("insumoId") ?? "");
  const cantidad = num(fd.get("cantidad"));
  const fecha = String(fd.get("fecha") ?? "");

  // Un insumo del catálogo aporta su nombre, categoría y precio vigente;
  // un renglón libre exige descripción y precio capturados a mano.
  let descripcion = String(fd.get("descripcion") ?? "").trim();
  let categoria = String(fd.get("categoria") ?? "OTRO") as CategoriaInsumo;
  let precio = num(fd.get("precioUnitario"));

  if (insumoId) {
    const insumo = await db.insumo.findUnique({ where: { id: insumoId } });
    if (!insumo) return { error: "El insumo seleccionado no existe en el catálogo." };
    descripcion = insumo.nombre;
    categoria = insumo.categoria;
    if (!fd.get("precioUnitario")) precio = Number(insumo.precio);
  }
  if (!descripcion) return { error: "Indique el material, medicamento o servicio." };
  if (cantidad <= 0) return { error: "La cantidad debe ser mayor que cero." };
  if (precio < 0) return { error: "El precio no puede ser negativo." };

  const datos = {
    insumoId: insumoId || null,
    descripcion,
    categoria,
    cantidad: decimal(cantidad),
    precioUnitario: decimal(precio),
    importe: decimal(cantidad * precio),
    fecha: fecha ? new Date(fecha) : null,
    enfermera: String(fd.get("enfermera") ?? "") || null,
    observaciones: String(fd.get("observaciones") ?? "") || null,
  };

  if (partidaId) {
    await db.consumoPartida.update({ where: { id: partidaId }, data: datos });
  } else {
    const ultimo = await db.consumoPartida.findFirst({
      where: { hojaId },
      orderBy: { orden: "desc" },
      select: { orden: true },
    });
    await db.consumoPartida.create({ data: { hojaId, orden: (ultimo?.orden ?? 0) + 1, ...datos } });
  }

  await audit({
    usuarioId: ctx.user.id, rol: ctx.user.rol, accion: partidaId ? "ACTUALIZAR" : "CREAR",
    entidad: "consumo_partida", entidadId: partidaId || hojaId, pacienteId: hoja.pacienteId,
    datosDespues: { descripcion, cantidad, precio },
  });
  revalidatePath(`/pacientes/${hoja.pacienteId}/consumo/${hojaId}`);
  return { ok: true };
}

export async function eliminarRenglonConsumo(partidaId: string): Promise<ActionState> {
  const partida = await db.consumoPartida.findUnique({
    where: { id: partidaId },
    include: { hoja: true },
  });
  if (!partida) return { error: "Renglón no encontrado." };
  if (partida.hoja.estado === "CERRADA") return { error: "La hoja está cerrada: es inmutable." };
  let ctx;
  try {
    ctx = await contextoConsumo(partida.hoja.pacienteId, true);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  await db.consumoPartida.delete({ where: { id: partidaId } });
  await audit({
    usuarioId: ctx.user.id, rol: ctx.user.rol, accion: "ELIMINAR", entidad: "consumo_partida",
    entidadId: partidaId, pacienteId: partida.hoja.pacienteId,
    datosAntes: { descripcion: partida.descripcion, importe: partida.importe.toString() },
  });
  revalidatePath(`/pacientes/${partida.hoja.pacienteId}/consumo/${partida.hojaId}`);
  return { ok: true };
}

/** Cerrar la hoja congela la cuenta: sólo administración puede hacerlo. */
export async function cerrarHojaConsumo(hojaId: string): Promise<ActionState> {
  const user = await requireRole("ADMIN");
  const hoja = await db.hojaConsumo.findUnique({
    where: { id: hojaId },
    include: { partidas: { select: { importe: true } } },
  });
  if (!hoja) return { error: "Hoja de consumo no encontrada." };
  if (hoja.estado === "CERRADA") return { error: "La hoja ya está cerrada." };
  if (hoja.partidas.length === 0) return { error: "No se puede cerrar una hoja sin renglones." };

  const total = hoja.partidas.reduce((s, p) => s + Number(p.importe), 0);
  await db.hojaConsumo.update({ where: { id: hojaId }, data: { estado: "CERRADA", fechaCierre: new Date() } });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "CERRAR", entidad: "hoja_consumo",
    entidadId: hojaId, pacienteId: hoja.pacienteId, datosDespues: { total },
  });
  revalidatePath(`/pacientes/${hoja.pacienteId}/consumo/${hojaId}`);
  return { ok: true };
}

// ── Impresión ───────────────────────────────────────────────────────────

const renglon = (p: {
  descripcion: string;
  cantidad: Prisma.Decimal;
  precioUnitario: Prisma.Decimal;
  importe: Prisma.Decimal;
  fecha: Date | null;
  enfermera: string | null;
  observaciones: string | null;
}): RenglonConsumo => ({
  descripcion: p.descripcion,
  cantidad: Number(p.cantidad),
  precioUnitario: Number(p.precioUnitario),
  importe: Number(p.importe),
  fecha: p.fecha ? fmtFechaCorta(p.fecha) : null,
  enfermera: p.enfermera,
  observaciones: p.observaciones,
});

export async function generarConsumoPdf(hojaId: string): Promise<ActionState | void> {
  const hoja = await db.hojaConsumo.findUnique({
    where: { id: hojaId },
    include: { partidas: { orderBy: { orden: "asc" } } },
  });
  if (!hoja) return { error: "Hoja de consumo no encontrada." };
  let ctx;
  try {
    ctx = await contextoConsumo(hoja.pacienteId, false);
  } catch (e) {
    if (e instanceof AuthzError) return { error: e.message };
    throw e;
  }
  const est = await cargarEstablecimiento();
  const paciente = pacientePdf(ctx.paciente);

  if (hoja.tipo === "PISO") {
    const { documentoId } = await guardarFormatoPdf({
      element: React.createElement(ConsumoPisoPdf, {
        d: {
          est,
          paciente,
          cuarto: hoja.cuarto,
          tratamiento: hoja.tratamiento,
          renglones: hoja.partidas.map(renglon),
          fecha: fmt(new Date()),
        },
      }),
      pacienteId: hoja.pacienteId,
      tipo: "CONSUMO_PISO",
      nombreArchivo: `Consumo-piso-${ctx.paciente.numeroExpediente}.pdf`,
      subidoPorId: ctx.user.id,
    });
    await audit({
      usuarioId: ctx.user.id, rol: ctx.user.rol, accion: "GENERAR_FORMATO", entidad: "documento",
      entidadId: documentoId, pacienteId: hoja.pacienteId, datosDespues: { tipo: "CONSUMO_PISO" },
    });
    redirect(`/api/documentos/${documentoId}`);
  }

  // Hoja de quirófano: el catálogo completo por categoría, con lo consumido
  // volcado sobre el renglón correspondiente (así funciona el checklist impreso).
  const insumos = await db.insumo.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { orden: "asc" }],
  });
  const porDescripcion = new Map(hoja.partidas.map((p) => [p.descripcion, p]));
  const catalogo = (categoria: CategoriaInsumo): RenglonConsumo[] =>
    insumos
      .filter((i) => i.categoria === categoria)
      .map((i) => {
        const p = porDescripcion.get(i.nombre);
        return p
          ? renglon(p)
          : { descripcion: i.nombre, cantidad: 0, precioUnitario: Number(i.precio), importe: 0 };
      });
  // Renglones libres que no están en el catálogo: van al recuadro «OTROS».
  const nombresCatalogo = new Set(insumos.map((i) => i.nombre));
  const otros = hoja.partidas.filter((p) => !nombresCatalogo.has(p.descripcion)).map(renglon);

  const { documentoId } = await guardarFormatoPdf({
    element: React.createElement(ConsumoQuirofanoPdf, {
      d: {
        est,
        paciente,
        materiales: catalogo("MATERIAL"),
        medicamentos: catalogo("MEDICAMENTO"),
        suturas: catalogo("SUTURA"),
        soluciones: catalogo("SOLUCION"),
        otros,
        servicios: catalogo("SERVICIO"),
        equipo: {
          medicoPediatra: hoja.medicoPediatra,
          medicoTratante: hoja.medicoTratante,
          medicoCirujano: hoja.medicoCirujano,
          medicoAnestesiologo: hoja.medicoAnestesiologo,
          medicoAyudante: hoja.medicoAyudante,
          enfermera: hoja.enfermera,
          instrumentista: hoja.instrumentista,
        },
        datos: {
          procedimiento: hoja.procedimiento,
          fechaIngreso: hoja.fechaIngreso ? fmtFecha(hoja.fechaIngreso) : null,
          fechaEgreso: hoja.fechaEgreso ? fmtFecha(hoja.fechaEgreso) : null,
          horaIngresoQuirofano: hoja.horaIngresoQuirofano,
          horaTerminoQuirofano: hoja.horaTerminoQuirofano,
          turno: hoja.turno,
        },
        fecha: fmt(new Date()),
      },
    }),
    pacienteId: hoja.pacienteId,
    tipo: "CONSUMO_QUIROFANO",
    nombreArchivo: `Consumo-quirofano-${ctx.paciente.numeroExpediente}.pdf`,
    subidoPorId: ctx.user.id,
  });
  await audit({
    usuarioId: ctx.user.id, rol: ctx.user.rol, accion: "GENERAR_FORMATO", entidad: "documento",
    entidadId: documentoId, pacienteId: hoja.pacienteId, datosDespues: { tipo: "CONSUMO_QUIROFANO" },
  });
  redirect(`/api/documentos/${documentoId}`);
}

// ── Catálogo de insumos (administración) ────────────────────────────────

export async function actualizarPrecioInsumo(insumoId: string, _p: ActionState, fd: FormData): Promise<ActionState> {
  const user = await requireRole("ADMIN");
  const precio = num(fd.get("precio"));
  if (precio < 0) return { error: "El precio no puede ser negativo." };
  const antes = await db.insumo.findUnique({ where: { id: insumoId }, select: { precio: true, nombre: true } });
  if (!antes) return { error: "Insumo no encontrado." };
  await db.insumo.update({ where: { id: insumoId }, data: { precio: decimal(precio) } });
  await audit({
    usuarioId: user.id, rol: user.rol, accion: "ACTUALIZAR", entidad: "insumo", entidadId: insumoId,
    datosAntes: { precio: antes.precio.toString() }, datosDespues: { precio },
  });
  revalidatePath("/admin/insumos");
  return { ok: true };
}
