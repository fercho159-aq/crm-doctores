"use client";

import { useActionState } from "react";
import { guardarNota, crearAdenda } from "@/actions/doctor";
import { Card, CardHeader, CardBody, Field, Textarea, ErrorMsg, OkMsg, Button } from "@/components/ui";
import { useFormStatus } from "react-dom";

function BotonesNota() {
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
          if (!window.confirm("Al firmar, la nota queda INMUTABLE (NOM-004). Correcciones posteriores solo por adenda. ¿Firmar nota?")) {
            e.preventDefault();
          }
        }}
      >
        {pending ? "Procesando…" : "Firmar nota"}
      </Button>
    </div>
  );
}

export function NotaEditor({
  asignacionId,
  notaId,
  inicial = {},
}: {
  asignacionId: string;
  notaId: string | null;
  inicial?: Record<string, string>;
}) {
  const [state, formAction] = useActionState(
    async (prev: { error?: string; ok?: boolean }, fd: FormData) => {
      const firmar = fd.get("_accion") === "firmar";
      return guardarNota(asignacionId, notaId, firmar, prev, fd);
    },
    {},
  );

  return (
    <Card className="border-blue-200">
      <CardHeader title="Nota de evolución (SOAP)" subtitle="NOM-004 6.2 — el plan debe incluir medicamento, dosis, vía y periodicidad." />
      <CardBody>
        <form action={formAction} className="space-y-4">
          <ErrorMsg>{state.error}</ErrorMsg>
          {state.ok && <OkMsg>Guardado.</OkMsg>}
          <Field label="S — Subjetivo (evolución referida por el paciente)">
            <Textarea name="subjetivo" rows={2} defaultValue={inicial.subjetivo} />
          </Field>
          <Field label="O — Objetivo (exploración, signos vitales relevantes)">
            <Textarea name="objetivo" rows={2} defaultValue={inicial.objetivo} />
          </Field>
          <Field label="Resultados de estudios de laboratorio y gabinete">
            <Textarea name="resultadosEstudios" rows={2} defaultValue={inicial.resultadosEstudios} />
          </Field>
          <Field label="A — Diagnóstico(s)" required>
            <Textarea name="diagnosticos" rows={2} defaultValue={inicial.diagnosticos} />
          </Field>
          <Field label="P — Plan de tratamiento" required hint="Medicamento, dosis, vía y periodicidad (NOM-004 6.2.5).">
            <Textarea name="planTratamiento" rows={3} defaultValue={inicial.planTratamiento} />
          </Field>
          <Field label="Pronóstico">
            <Textarea name="pronostico" rows={1} defaultValue={inicial.pronostico} />
          </Field>
          <BotonesNota />
        </form>
      </CardBody>
    </Card>
  );
}

export function AdendaForm({ notaPadreId }: { notaPadreId: string }) {
  const [state, formAction] = useActionState(crearAdenda.bind(null, notaPadreId), {});
  return (
    <form action={formAction} className="space-y-2 border-t border-slate-100 pt-3">
      <ErrorMsg>{state.error}</ErrorMsg>
      <Field label="Agregar adenda (la nota original no se modifica)">
        <Textarea name="texto" rows={2} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary">Firmar adenda</Button>
      </div>
    </form>
  );
}
