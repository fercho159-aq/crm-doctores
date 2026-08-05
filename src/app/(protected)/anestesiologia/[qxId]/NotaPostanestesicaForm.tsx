"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { guardarNotaPostanestesica } from "@/actions/anestesia";
import { Card, CardHeader, CardBody, Field, Input, Textarea, ErrorMsg, OkMsg, Button, Badge, Label } from "@/components/ui";
import { GrupoRadio } from "@/components/Casillas";
import { SignaturePad } from "@/components/SignaturePad";
import { ALDRETE_CRITERIOS, ALDRETE_TIEMPOS, RAMSAY, BROMAGE, DESTINO_RECUPERACION, PLAN_POSTANESTESICO } from "@/lib/escalasAnestesia";

export type NotaPostInicial = {
  aldrete: Record<string, Record<string, string>>;
  ramsay: string;
  bromage: string;
  nota: string;
  planOxigeno: string;
  planSolucionesIV: string;
  planMedicamentos: string;
  planComponentesSanguineos: string;
  planManejoDolor: string;
  motivoEgreso: string;
  pasaA: string;
};

function Botones({ editable }: { editable: boolean }) {
  const { pending } = useFormStatus();
  if (!editable) return null;
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
          if (!window.confirm("Al firmar, la nota post-anestésica queda INMUTABLE. ¿Firmar?")) e.preventDefault();
        }}
      >
        Firmar nota
      </Button>
    </div>
  );
}

export function NotaPostanestesicaForm({
  qxId,
  editable,
  firmada,
  inicial,
}: {
  qxId: string;
  editable: boolean;
  firmada: boolean;
  inicial: NotaPostInicial;
}) {
  const [state, formAction] = useActionState(
    async (prev: { error?: string; ok?: boolean }, fd: FormData) =>
      guardarNotaPostanestesica(qxId, fd.get("_accion") === "firmar", prev, fd),
    {},
  );
  const ro = editable ? {} : { readOnly: true, disabled: true };
  const plan: Record<string, string> = {
    planOxigeno: inicial.planOxigeno,
    planSolucionesIV: inicial.planSolucionesIV,
    planMedicamentos: inicial.planMedicamentos,
    planComponentesSanguineos: inicial.planComponentesSanguineos,
    planManejoDolor: inicial.planManejoDolor,
  };

  return (
    <Card>
      <CardHeader
        title="Recuperación anestésica y nota post-anestésica"
        subtitle="Hoja oficial 19: Aldrete modificada por tiempos, Ramsay, Bromage, nota y plan post-anestésico."
        action={firmada ? <Badge tone="green">Firmada — inmutable</Badge> : <Badge tone="amber">Borrador</Badge>}
      />
      <CardBody>
        <form action={formAction} className="space-y-4">
          <ErrorMsg>{state.error}</ErrorMsg>
          {state.ok && <OkMsg>Guardado.</OkMsg>}

          <fieldset className="rounded-lg border border-slate-200 p-3">
            <legend className="px-1 text-sm font-semibold text-blue-800">Escala de Aldrete modificada</legend>
            <p className="mb-2 text-xs text-slate-500">
              Califique 0, 1 o 2 en cada criterio, por minuto de valoración. El total se calcula al imprimir.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="border border-slate-200 px-2 py-1.5 text-left">Criterio</th>
                    {ALDRETE_TIEMPOS.map((m) => (
                      <th key={m} className="w-16 border border-slate-200 px-1 py-1.5">
                        {m} min
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALDRETE_CRITERIOS.map((c) => (
                    <tr key={c.campo}>
                      <td className="border border-slate-200 px-2 py-1">
                        <span className="font-medium text-slate-700">{c.etiqueta}</span>
                        <span className="block text-xs text-slate-400">
                          {c.niveles.map((n) => `${n.puntos}: ${n.texto}`).join(" · ")}
                        </span>
                      </td>
                      {ALDRETE_TIEMPOS.map((m) => (
                        <td key={m} className="border border-slate-200 p-1">
                          <select
                            name={`aldrete.${m}.${c.campo}`}
                            defaultValue={inicial.aldrete[String(m)]?.[c.campo] ?? ""}
                            disabled={!editable}
                            className="w-full rounded border border-slate-300 px-1 py-1 text-sm disabled:bg-slate-50"
                          >
                            <option value="">—</option>
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                          </select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <fieldset className="rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-blue-800">Escala de sedación de Ramsay</legend>
              <GrupoRadio
                name="ramsay"
                opciones={RAMSAY.map((x) => ({ clave: String(x.nivel), texto: `${x.nivel} · ${x.estado} — ${x.texto}` }))}
                valor={inicial.ramsay}
                editable={editable}
              />
            </fieldset>
            <fieldset className="rounded-lg border border-slate-200 p-3">
              <legend className="px-1 text-sm font-semibold text-blue-800">Escala de Bromage — bloqueo motor</legend>
              <GrupoRadio
                name="bromage"
                opciones={BROMAGE.map((x) => ({ clave: String(x.nivel), texto: `${x.nivel} · ${x.texto}` }))}
                valor={inicial.bromage}
                editable={editable}
              />
            </fieldset>
          </div>

          <Field label="Nota post-anestésica" required>
            <Textarea name="nota" rows={5} defaultValue={inicial.nota} {...ro} />
          </Field>

          <fieldset className="rounded-lg border border-slate-200 p-3">
            <legend className="px-1 text-sm font-semibold text-blue-800">Plan post-anestésico</legend>
            <div className="space-y-2">
              {PLAN_POSTANESTESICO.map((p) => (
                <Field key={p.campo} label={p.etiqueta}>
                  <Input name={p.campo} defaultValue={plan[p.campo] ?? ""} {...ro} />
                </Field>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Motivo de egreso del área de recuperación">
              <Input name="motivoEgreso" defaultValue={inicial.motivoEgreso} {...ro} />
            </Field>
            <GrupoRadio
              name="pasaA"
              label="El paciente de recuperación pasa a"
              opciones={DESTINO_RECUPERACION}
              valor={inicial.pasaA}
              editable={editable}
              columnas={2}
            />
          </div>

          {editable && (
            <div className="max-w-sm">
              <Label>Firma del anestesiólogo (tableta)</Label>
              <SignaturePad name="firmaAnestesiologo" label="Firma del anestesiólogo" />
            </div>
          )}

          <Botones editable={editable} />
        </form>
      </CardBody>
    </Card>
  );
}
