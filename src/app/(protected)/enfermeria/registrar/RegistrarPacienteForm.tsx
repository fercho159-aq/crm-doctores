"use client";

import { useActionState, useState } from "react";
import { registrarPaciente } from "@/actions/enfermeria";
import { Card, CardBody, CardHeader, Field, Input, Select, ErrorMsg } from "@/components/ui";
import { SubmitButton } from "@/components/forms";

export function RegistrarPacienteForm() {
  const [state, formAction] = useActionState(registrarPaciente, {});
  const [sinCorreo, setSinCorreo] = useState(false);

  return (
    <form action={formAction} className="space-y-6">
      <ErrorMsg>{state.error}</ErrorMsg>

      <Card>
        <CardHeader title="Identificación" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nombre(s)" required><Input name="nombre" required /></Field>
          <Field label="Apellido paterno" required><Input name="apellidoPaterno" required /></Field>
          <Field label="Apellido materno"><Input name="apellidoMaterno" /></Field>
          <Field label="Fecha de nacimiento" required><Input name="fechaNacimiento" type="date" required /></Field>
          <Field label="Sexo" required>
            <Select name="sexo" required defaultValue="">
              <option value="" disabled>Seleccione…</option>
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="O">Otro</option>
            </Select>
          </Field>
          <Field label="CURP"><Input name="curp" maxLength={18} /></Field>
          <Field label="Tipo de sangre">
            <Select name="tipoSangre" defaultValue="">
              <option value="">Se desconoce</option>
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Estado civil"><Input name="estadoCivil" /></Field>
          <Field label="Ocupación"><Input name="ocupacion" /></Field>
          <Field label="Escolaridad"><Input name="escolaridad" /></Field>
          <Field label="Religión"><Input name="religion" /></Field>
          <Field label="Nacionalidad"><Input name="nacionalidad" /></Field>
          <Field label="Referencia (¿cómo nos conoció?)">
            <Select name="referencia" defaultValue="">
              <option value="">Sin especificar</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Personal">Personal</option>
              <option value="Otro">Otro</option>
            </Select>
          </Field>
          <Field label="Derechohabiencia"><Input name="derechohabiencia" placeholder="IMSS, ISSSTE, ninguna…" /></Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Contacto" subtitle="El correo es el destino del envío automático de recetas." />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Teléfono" required><Input name="telefono" type="tel" required /></Field>
          <Field label="Correo electrónico" required={!sinCorreo}>
            <Input name="email" type="email" disabled={sinCorreo} placeholder="paciente@correo.com" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
            <input
              type="checkbox"
              name="sinCorreo"
              value="true"
              checked={sinCorreo}
              onChange={(e) => setSinCorreo(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Paciente sin correo electrónico (las recetas solo podrán imprimirse o descargarse)
          </label>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Domicilio" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Calle y número"><Input name="calle" /></Field>
          <Field label="Colonia"><Input name="colonia" /></Field>
          <Field label="Municipio / Alcaldía"><Input name="municipio" /></Field>
          <Field label="Estado"><Input name="estado" /></Field>
          <Field label="Código postal"><Input name="cp" maxLength={5} /></Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Contacto de emergencia" />
        <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Nombre"><Input name="contactoEmergenciaNombre" /></Field>
          <Field label="Teléfono"><Input name="contactoEmergenciaTelefono" type="tel" /></Field>
          <Field label="Parentesco"><Input name="contactoEmergenciaParentesco" /></Field>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <SubmitButton>Guardar y continuar con la hoja clínica →</SubmitButton>
      </div>
    </form>
  );
}
