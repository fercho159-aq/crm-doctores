"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { guardarOrdenes } from "@/actions/hojasMedicas";
import { Card, CardHeader, CardBody, Field, Input, ErrorMsg, OkMsg, Button, Badge } from "@/components/ui";
import { FilasDinamicas } from "@/components/FilasDinamicas";
import { CATEGORIA_ORDEN_LABEL } from "@/pdf/formatos";

const CATEGORIAS = Object.entries(CATEGORIA_ORDEN_LABEL).map(([value, label]) => ({ value, label }));

function Botones() {
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
          if (!window.confirm("Al firmar, la hoja de órdenes queda INMUTABLE (NOM-004). ¿Firmar?")) e.preventDefault();
        }}
      >
        Firmar hoja de órdenes
      </Button>
    </div>
  );
}

export function OrdenesForm({
  pacienteId,
  editable,
  hojaId,
  cuarto,
  partidas,
}: {
  pacienteId: string;
  editable: boolean;
  hojaId?: string;
  cuarto: string;
  partidas: Record<string, string>[];
}) {
  const [state, formAction] = useActionState(
    async (prev: { error?: string; ok?: boolean }, fd: FormData) =>
      guardarOrdenes(pacienteId, fd.get("_accion") === "firmar", prev, fd),
    {},
  );

  return (
    <Card>
      <CardHeader
        title="Hoja de órdenes médicas"
        subtitle="Indicaciones del día: dieta, cuidados de enfermería, soluciones, medicamentos y estudios."
        action={<Badge tone="amber">Borrador</Badge>}
      />
      <CardBody>
        <form action={formAction} className="space-y-4">
          <ErrorMsg>{state.error}</ErrorMsg>
          {state.ok && <OkMsg>Guardado.</OkMsg>}
          {hojaId && <input type="hidden" name="hojaId" value={hojaId} />}

          <div className="sm:w-48">
            <Field label="Cuarto">
              <Input name="cuarto" defaultValue={cuarto} readOnly={!editable} disabled={!editable} />
            </Field>
          </div>

          <FilasDinamicas
            editable={editable}
            inicial={partidas}
            minimo={5}
            etiquetaAgregar="Agregar indicación"
            columnas={[
              { name: "o_categoria", label: "Categoría", ancho: "w-56", opciones: CATEGORIAS },
              { name: "o_texto", label: "Indicación", placeholder: "Ceftriaxona 1 g IV cada 12 horas" },
            ]}
          />

          {editable && <Botones />}
        </form>
      </CardBody>
    </Card>
  );
}
