"use client";

import { useActionState } from "react";
import { guardarConfiguracion } from "@/actions/admin";
import { Field, Input, ErrorMsg, OkMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function ConfigForm({ inicial }: { inicial: Record<string, string> }) {
  const [state, formAction] = useActionState(guardarConfiguracion, {});
  return (
    <form action={formAction} className="space-y-4">
      <ErrorMsg>{state.error}</ErrorMsg>
      {state.ok && <OkMsg>Configuración guardada.</OkMsg>}
      <Field label="Razón social" required>
        <Input name="razonSocial" defaultValue={inicial.razonSocial} required />
      </Field>
      <Field label="Domicilio del establecimiento" required>
        <Input name="domicilio" defaultValue={inicial.domicilio} required />
      </Field>
      <Field label="Teléfono" required>
        <Input name="telefono" defaultValue={inicial.telefono} required />
      </Field>
      <Field label="Correo remitente de recetas" required hint="Con dominio verificado en Resend (SPF/DKIM/DMARC) para no caer en spam.">
        <Input name="emailRemitente" type="email" defaultValue={inicial.emailRemitente} required />
      </Field>

      <p className="pt-2 text-sm font-semibold text-slate-700">Datos que imprimen los formatos oficiales</p>
      <Field label="Licencia sanitaria" hint="Sale en el encabezado de todos los formatos del expediente.">
        <Input name="licenciaSanitaria" defaultValue={inicial.licenciaSanitaria} placeholder="19-AM-15-058-0006" />
      </Field>
      <Field label="RFC" hint="Aparece al pie de la ficha de identificación.">
        <Input name="rfc" defaultValue={inicial.rfc} />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Expediente COFEPRIS">
          <Input name="expedienteCofepris" defaultValue={inicial.expedienteCofepris} placeholder="PFC.B.E. 7/005256-2024" />
        </Field>
        <Field label="Oficio COFEPRIS">
          <Input name="oficioCofepris" defaultValue={inicial.oficioCofepris} placeholder="10615922" />
        </Field>
      </div>

      <SubmitButton>Guardar configuración</SubmitButton>
    </form>
  );
}
