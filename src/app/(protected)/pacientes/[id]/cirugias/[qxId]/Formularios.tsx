"use client";

import { useActionState } from "react";
import { guardarNotaPre, guardarNotaPost, programarCita, actualizarCita } from "@/actions/quirurgico";
import { Card, CardHeader, CardBody, Field, Input, Textarea, Select, ErrorMsg, OkMsg, Button, Badge } from "@/components/ui";
import { useFormStatus } from "react-dom";

type Ini = Record<string, string>;

function BotonesFirma({ nota }: { nota: string }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex justify-end gap-3">
      <Button type="submit" name="_accion" value="borrador" variant="secondary" disabled={pending}>
        {pending ? "Guardando…" : "Guardar borrador"}
      </Button>
      <Button
        type="submit"
        name="_accion"
        value="firmar"
        disabled={pending}
        onClick={(e) => {
          if (!window.confirm(`Al firmar, la ${nota} queda INMUTABLE (NOM-004). ¿Firmar?`)) e.preventDefault();
        }}
      >
        Firmar
      </Button>
    </div>
  );
}

export function NotaPreForm({ qxId, editable, firmada, inicial }: { qxId: string; editable: boolean; firmada: boolean; inicial: Ini }) {
  const [state, formAction] = useActionState(
    async (prev: { error?: string; ok?: boolean }, fd: FormData) =>
      guardarNotaPre(qxId, fd.get("_accion") === "firmar", prev, fd),
    {},
  );
  const ro = editable ? {} : { readOnly: true, disabled: true };
  return (
    <Card>
      <CardHeader
        title="Paso 1 — Nota preoperatoria (NOM-004 8.5)"
        action={firmada ? <Badge tone="green">Firmada — inmutable</Badge> : <Badge tone="amber">Borrador</Badge>}
      />
      <CardBody>
        <form action={formAction} className="space-y-3">
          <ErrorMsg>{state.error}</ErrorMsg>
          {state.ok && <OkMsg>Guardado.</OkMsg>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Diagnóstico preoperatorio" required>
              <Textarea name="diagnosticoPreoperatorio" rows={2} defaultValue={inicial.diagnosticoPreoperatorio} {...ro} />
            </Field>
            <Field label="Plan quirúrgico (operación proyectada)" required>
              <Textarea name="planQuirurgico" rows={2} defaultValue={inicial.planQuirurgico} {...ro} />
            </Field>
            <Field label="Tipo de cirugía" required>
              <Select name="tipoCirugia" defaultValue={inicial.tipoCirugia || ""} {...ro}>
                <option value="" disabled>Seleccione…</option>
                <option value="Programada / electiva">Programada / electiva</option>
                <option value="Urgencia">Urgencia</option>
              </Select>
            </Field>
            <Field label="Riesgo quirúrgico (con justificación: ASA, Goldman…)" required>
              <Input name="riesgoQuirurgico" defaultValue={inicial.riesgoQuirurgico} placeholder="ASA II — hipertensión controlada" {...ro} />
            </Field>
            <Field label="Cuidados y plan terapéutico preoperatorio">
              <Textarea name="cuidadosPlanTerapeutico" rows={2} defaultValue={inicial.cuidadosPlanTerapeutico} {...ro} />
            </Field>
            <Field label="Pronóstico" required>
              <Input name="pronostico" defaultValue={inicial.pronostico} {...ro} />
            </Field>
          </div>
          {editable && <BotonesFirma nota="nota preoperatoria" />}
        </form>
      </CardBody>
    </Card>
  );
}

export function NotaPostForm({ qxId, editable, firmada, inicial }: { qxId: string; editable: boolean; firmada: boolean; inicial: Ini }) {
  const [state, formAction] = useActionState(
    async (prev: { error?: string; ok?: boolean }, fd: FormData) =>
      guardarNotaPost(qxId, fd.get("_accion") === "firmar", prev, fd),
    {},
  );
  const ro = editable ? {} : { readOnly: true, disabled: true };
  return (
    <Card>
      <CardHeader
        title="Paso 3 — Nota postoperatoria (NOM-004 8.8) — Descripción del procedimiento quirúrgico"
        action={firmada ? <Badge tone="green">Firmada — inmutable</Badge> : <Badge tone="amber">Borrador</Badge>}
      />
      <CardBody>
        <form action={formAction} className="space-y-3">
          <ErrorMsg>{state.error}</ErrorMsg>
          {state.ok && <OkMsg>Guardado.</OkMsg>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Diagnóstico preoperatorio">
              <Textarea name="diagnosticoPreoperatorio" rows={2} defaultValue={inicial.diagnosticoPreoperatorio} {...ro} />
            </Field>
            <Field label="Operación planeada">
              <Textarea name="operacionPlaneada" rows={2} defaultValue={inicial.operacionPlaneada} {...ro} />
            </Field>
            <Field label="Operación realizada" required>
              <Textarea name="operacionRealizada" rows={2} defaultValue={inicial.operacionRealizada} {...ro} />
            </Field>
            <Field label="Diagnóstico postoperatorio" required>
              <Textarea name="diagnosticoPostoperatorio" rows={2} defaultValue={inicial.diagnosticoPostoperatorio} {...ro} />
            </Field>
            <Field label="Descripción de la técnica quirúrgica" required>
              <Textarea name="descripcionTecnica" rows={3} defaultValue={inicial.descripcionTecnica} {...ro} />
            </Field>
            <Field label="Hallazgos transoperatorios" required>
              <Textarea name="hallazgos" rows={3} defaultValue={inicial.hallazgos} {...ro} />
            </Field>
            <Field label="Conteo de gasas, compresas e instrumental" required>
              <Input name="conteoGasas" defaultValue={inicial.conteoGasas} placeholder="Completo / incidencias" {...ro} />
            </Field>
            <Field label="Incidentes y accidentes">
              <Input name="incidentesAccidentes" defaultValue={inicial.incidentesAccidentes} placeholder="Sin incidentes" {...ro} />
            </Field>
            <Field label="Cuantificación de sangrado" required>
              <Input name="cuantificacionSangrado" defaultValue={inicial.cuantificacionSangrado} placeholder="Ej. 150 mL" {...ro} />
            </Field>
            <Field label="Transfusiones (si aplica)">
              <Input name="transfusiones" defaultValue={inicial.transfusiones} {...ro} />
            </Field>
            <Field label="Estudios transoperatorios (si aplica)">
              <Input name="estudiosTransoperatorios" defaultValue={inicial.estudiosTransoperatorios} {...ro} />
            </Field>
            <Field label="Equipo quirúrgico" hint="Cirujano, anestesiólogo, instrumentista, circulante, ayudantes (con cédulas).">
              <Textarea name="equipoQuirurgico" rows={2} defaultValue={inicial.equipoQuirurgico} {...ro} />
            </Field>
            <Field label="Estado postquirúrgico inmediato" required>
              <Input name="estadoPostquirurgico" defaultValue={inicial.estadoPostquirurgico} {...ro} />
            </Field>
            <Field label="Plan de manejo y tratamiento" required>
              <Textarea name="planManejo" rows={2} defaultValue={inicial.planManejo} {...ro} />
            </Field>
            <Field label="Pronóstico" required>
              <Input name="pronostico" defaultValue={inicial.pronostico} {...ro} />
            </Field>
            <Field label="Envío de piezas a patología (si aplica)">
              <Input name="envioPiezasPatologia" defaultValue={inicial.envioPiezasPatologia} {...ro} />
            </Field>
          </div>
          {editable && <BotonesFirma nota="nota postoperatoria" />}
        </form>
      </CardBody>
    </Card>
  );
}

const ESTADO_CITA: Record<string, { label: string; tone: "blue" | "green" | "red" | "slate" | "amber" }> = {
  PROGRAMADA: { label: "Programada", tone: "blue" },
  REALIZADA: { label: "Realizada", tone: "green" },
  NO_ASISTIO: { label: "No asistió", tone: "amber" },
  REPROGRAMADA: { label: "Reprogramada", tone: "slate" },
  CANCELADA: { label: "Cancelada", tone: "red" },
};

function CitaItem({ cita, editable }: { cita: { id: string; fecha: string; motivo: string; estado: string; observaciones: string | null }; editable: boolean }) {
  const [state, formAction] = useActionState(actualizarCita.bind(null, cita.id), {});
  return (
    <div className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-slate-800">{cita.fecha} — {cita.motivo}</p>
          {cita.observaciones && <p className="text-sm text-slate-500">{cita.observaciones}</p>}
        </div>
        <Badge tone={ESTADO_CITA[cita.estado].tone}>{ESTADO_CITA[cita.estado].label}</Badge>
      </div>
      {editable && cita.estado === "PROGRAMADA" && (
        <form action={formAction} className="mt-2 flex flex-wrap items-end gap-2">
          <ErrorMsg>{state.error}</ErrorMsg>
          <Select name="estado" className="w-auto" defaultValue="REALIZADA">
            <option value="REALIZADA">Atendida</option>
            <option value="NO_ASISTIO">No asistió</option>
            <option value="REPROGRAMADA">Reprogramar</option>
            <option value="CANCELADA">Cancelar</option>
          </Select>
          <Input name="nuevaFecha" type="datetime-local" className="w-auto" />
          <Input name="observaciones" placeholder="Observaciones / seguimiento" className="w-56" />
          <Button type="submit" size="sm" variant="secondary">Registrar</Button>
        </form>
      )}
    </div>
  );
}

export function CitasQx({
  qxId,
  editable,
  citas,
}: {
  qxId: string;
  editable: boolean;
  citas: { id: string; fecha: string; motivo: string; estado: string; observaciones: string | null }[];
}) {
  const [state, formAction] = useActionState(programarCita.bind(null, qxId), {});
  return (
    <Card>
      <CardHeader title="Paso 4 — Citas postoperatorias" subtitle="Seguimiento: retiro de puntos, valoración, curaciones…" />
      <CardBody>
        {citas.length === 0 ? (
          <p className="py-2 text-sm text-slate-500">Sin citas programadas.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {citas.map((c) => <CitaItem key={c.id} cita={c} editable={editable} />)}
          </div>
        )}
        {editable && (
          <form action={formAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4">
            <ErrorMsg>{state.error}</ErrorMsg>
            {state.ok && <OkMsg>Cita programada.</OkMsg>}
            <Field label="Fecha y hora">
              <Input name="fechaHoraProgramada" type="datetime-local" required className="w-auto" />
            </Field>
            <Field label="Motivo">
              <Input name="motivo" required placeholder="Retiro de puntos" className="w-56" />
            </Field>
            <Button type="submit" variant="secondary">Programar cita</Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
