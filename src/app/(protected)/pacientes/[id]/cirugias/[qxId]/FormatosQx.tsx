"use client";

import { useActionState, useState } from "react";
import {
  generarConsentimientoQx,
  generarConsentimientoAnestesia,
  generarAutorizacionQx,
} from "@/actions/formatos";
import { Card, CardHeader, CardBody, Field, Input, Textarea, Select, ErrorMsg, Button } from "@/components/ui";
import { SignaturePad } from "@/components/SignaturePad";
import { SubmitButton } from "@/components/forms";
import type { ActionState } from "@/actions/auth";

function Colapsable({ titulo, subtitulo, children }: { titulo: string; subtitulo: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <Card>
      <button type="button" className="w-full text-left" onClick={() => setAbierto((v) => !v)}>
        <CardHeader title={`${abierto ? "▾" : "▸"} ${titulo}`} subtitle={subtitulo} />
      </button>
      {abierto && <CardBody>{children}</CardBody>}
    </Card>
  );
}

export function FormatosQx({
  qxId,
  prefill,
}: {
  qxId: string;
  prefill: { diagnostico: string; plan: string; tipoCirugia: string };
}) {
  const wrap = (fn: (qxId: string, p: ActionState, fd: FormData) => Promise<ActionState | void>) =>
    async (p: ActionState, fd: FormData): Promise<ActionState> => (await fn(qxId, p, fd)) ?? {};

  const [cqx, accCqx] = useActionState(wrap(generarConsentimientoQx), {});
  const [cane, accCane] = useActionState(wrap(generarConsentimientoAnestesia), {});
  const [aut, accAut] = useActionState(wrap(generarAutorizacionQx), {});

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-800">Paso 2 — Consentimientos y autorización (firma en tableta)</h3>

      <Colapsable
        titulo="Carta de consentimiento bajo información (quirúrgico)"
        subtitulo="Se llena con datos del expediente; el paciente firma en pantalla y el PDF queda en Documentos."
      >
        <form action={accCqx} className="space-y-4">
          <ErrorMsg>{cqx.error}</ErrorMsg>
          <Field label="Diagnóstico" required>
            <Input name="diagnostico" defaultValue={prefill.diagnostico} required />
          </Field>
          <Field label="Acto médico quirúrgico propuesto" required>
            <Textarea name="actoPropuesto" rows={2} defaultValue={prefill.plan} required />
          </Field>
          <Field label="Riesgos y posibles complicaciones explicados" required>
            <Textarea
              name="riesgos"
              rows={3}
              placeholder="Sangrado, hematoma, infección, cicatrización anómala, asimetría, necesidad de reintervención…"
              required
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SignaturePad name="firmaPaciente" label="Firma del paciente" requerida />
            <div className="space-y-2">
              <Input name="nombreResponsable" placeholder="Nombre del responsable (si aplica)" />
              <SignaturePad name="firmaResponsable" label="Firma del responsable" />
            </div>
            <div className="space-y-2">
              <Input name="nombreTestigo" placeholder="Nombre del testigo (opcional)" />
              <SignaturePad name="firmaTestigo" label="Firma del testigo" />
            </div>
          </div>
          <SubmitButton confirm="Se generará el consentimiento con las firmas capturadas y quedará registrado en el expediente. ¿Generar?">
            Generar consentimiento firmado (PDF)
          </SubmitButton>
        </form>
      </Colapsable>

      <Colapsable
        titulo="Consentimiento para procedimiento con anestesia"
        subtitulo="Formato MIT; firman anestesiólogo y paciente en pantalla."
      >
        <form action={accCane} className="space-y-4">
          <ErrorMsg>{cane.error}</ErrorMsg>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Médico anestesiólogo" required>
              <Input name="anestesiologo" required placeholder="Dr(a). Nombre Apellidos" />
            </Field>
            <Field label="Cédula del anestesiólogo" required>
              <Input name="cedulaAnestesiologo" required />
            </Field>
          </div>
          <Field label="Diagnóstico" required>
            <Input name="diagnostico" defaultValue={prefill.diagnostico} required />
          </Field>
          <Field label="Acto quirúrgico proyectado" required>
            <Input name="actoQuirurgico" defaultValue={prefill.plan} required />
          </Field>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SignaturePad name="firmaAnestesiologo" label="Firma del anestesiólogo" />
            <SignaturePad name="firmaPaciente" label="Firma del paciente" requerida />
            <div className="space-y-2">
              <Input name="nombreResponsable" placeholder="Nombre del responsable (si aplica)" />
              <SignaturePad name="firmaResponsable" label="Firma del responsable" />
            </div>
          </div>
          <SubmitButton confirm="Se generará el consentimiento de anestesia con las firmas capturadas. ¿Generar?">
            Generar consentimiento de anestesia (PDF)
          </SubmitButton>
        </form>
      </Colapsable>

      <Colapsable
        titulo="Hoja de autorización, solicitud y registro de intervención quirúrgica"
        subtitulo="Toma diagnóstico y operación proyectada de la nota preoperatoria; el paciente autoriza y firma."
      >
        <form action={accAut} className="space-y-4">
          <ErrorMsg>{aut.error}</ErrorMsg>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Tipo de operación" required>
              <Select name="tipoOperacion" defaultValue={prefill.tipoCirugia.includes("rgencia") ? "Urgente" : "Electiva"}>
                <option value="Electiva">Electiva</option>
                <option value="Urgente">Urgente</option>
              </Select>
            </Field>
            <Field label="Anestesia planeada" required>
              <Select name="anestesiaPlaneada" defaultValue="General">
                <option value="Local">Local</option>
                <option value="Regional">Regional</option>
                <option value="General">General</option>
                <option value="Sedación">Sedación</option>
              </Select>
            </Field>
            <Field label="Sangre (reserva)">
              <Input name="sangre" placeholder="Ej. No requerida / 1 paquete globular" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SignaturePad name="firmaPaciente" label="Firma del paciente" requerida />
            <div className="space-y-2">
              <Input name="nombreResponsable" placeholder="Nombre del responsable legal (si aplica)" />
              <SignaturePad name="firmaResponsable" label="Firma del responsable legal" />
            </div>
            <div className="space-y-2">
              <Input name="nombreTestigo" placeholder="Nombre del testigo (opcional)" />
              <SignaturePad name="firmaTestigo" label="Firma del testigo" />
            </div>
          </div>
          <SubmitButton confirm="Se generará la hoja de autorización con las firmas capturadas. ¿Generar?">
            Generar hoja de autorización (PDF)
          </SubmitButton>
        </form>
      </Colapsable>
    </div>
  );
}

export function BotonGenerarPdf({ action, children }: { action: () => Promise<ActionState | void>; children: React.ReactNode }) {
  return (
    <form action={action as unknown as (fd: FormData) => Promise<void>}>
      <Button type="submit" variant="secondary" size="sm">{children}</Button>
    </form>
  );
}
