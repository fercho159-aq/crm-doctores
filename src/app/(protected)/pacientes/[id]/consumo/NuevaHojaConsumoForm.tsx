"use client";

import { useActionState, useState } from "react";
import { crearHojaConsumo } from "@/actions/consumo";
import { Card, CardHeader, CardBody, Field, Input, Select, ErrorMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";
import type { ActionState } from "@/actions/auth";

// Los datos de cabecera cambian según la hoja: la de quirófano pide equipo
// médico y tiempos de sala; la de piso, cuarto y tratamiento.
export function NuevaHojaConsumoForm({
  pacienteId,
  cirugias,
}: {
  pacienteId: string;
  cirugias: { id: string; etiqueta: string }[];
}) {
  const [state, formAction] = useActionState(
    async (prev: ActionState, fd: FormData): Promise<ActionState> => (await crearHojaConsumo(pacienteId, prev, fd)) ?? {},
    {},
  );
  const [tipo, setTipo] = useState<"QUIROFANO" | "PISO">("QUIROFANO");

  return (
    <Card>
      <CardHeader title="Abrir hoja de consumo" subtitle="Enfermería registra las piezas; administración captura precios y cierra." />
      <CardBody>
        <form action={formAction} className="space-y-4">
          <ErrorMsg>{state.error}</ErrorMsg>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Tipo de hoja" required>
              <Select name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "QUIROFANO" | "PISO")}>
                <option value="QUIROFANO">Consumo en quirófano</option>
                <option value="PISO">Consumo de piso</option>
              </Select>
            </Field>
            <Field label="Cuarto">
              <Input name="cuarto" />
            </Field>
            {tipo === "PISO" ? (
              <Field label="Tratamiento">
                <Input name="tratamiento" placeholder="Postoperatorio de…" />
              </Field>
            ) : (
              <Field label="Procedimiento">
                <Input name="procedimiento" placeholder="Colecistectomía laparoscópica" />
              </Field>
            )}
          </div>

          {tipo === "QUIROFANO" && (
            <>
              {cirugias.length > 0 && (
                <Field label="Ligar a expediente quirúrgico" hint="Opcional; enlaza la cuenta con la cirugía.">
                  <Select name="expedienteQxId" defaultValue="">
                    <option value="">Sin ligar</option>
                    {cirugias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.etiqueta}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Fecha de ingreso">
                  <Input name="fechaIngreso" type="date" />
                </Field>
                <Field label="Fecha de egreso">
                  <Input name="fechaEgreso" type="date" />
                </Field>
                <Field label="Turno">
                  <Select name="turno" defaultValue="">
                    <option value="">—</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Vespertino">Vespertino</option>
                    <option value="Nocturno">Nocturno</option>
                    <option value="Jornada acumulada">Jornada acumulada</option>
                  </Select>
                </Field>
                <Field label="Hora de ingreso a quirófano">
                  <Input name="horaIngresoQuirofano" type="time" />
                </Field>
                <Field label="Hora de término de quirófano">
                  <Input name="horaTerminoQuirofano" type="time" />
                </Field>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Médico tratante">
                  <Input name="medicoTratante" />
                </Field>
                <Field label="Médico cirujano">
                  <Input name="medicoCirujano" />
                </Field>
                <Field label="Médico anestesiólogo">
                  <Input name="medicoAnestesiologo" />
                </Field>
                <Field label="Médico ayudante">
                  <Input name="medicoAyudante" />
                </Field>
                <Field label="Médico pediatra">
                  <Input name="medicoPediatra" />
                </Field>
                <Field label="Enfermera">
                  <Input name="enfermera" />
                </Field>
                <Field label="Instrumentista">
                  <Input name="instrumentista" />
                </Field>
              </div>
            </>
          )}

          <SubmitButton>Abrir hoja</SubmitButton>
        </form>
      </CardBody>
    </Card>
  );
}
