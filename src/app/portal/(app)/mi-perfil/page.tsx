import { Card, CardHeader, CardBody } from "@/components/ui";
import { cargarPacientePropio } from "../paciente";
import { PerfilPacienteForm, FotoPropiaForm } from "./Forms";

export default async function MiPerfilPortal() {
  const { paciente } = await cargarPacientePropio({ sinBitacora: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        <p className="text-sm text-slate-500">
          Puede actualizar sus datos de contacto. Su nombre, fecha de nacimiento y demás datos de
          identidad no se editan aquí — si hay un error, coméntelo con su consultorio.
        </p>
      </div>

      <Card>
        <CardHeader
          title="Identidad"
          subtitle="Estos datos solo los puede corregir el personal del consultorio."
        />
        <CardBody className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
          <p><span className="text-slate-400">Nombre completo</span><br />{paciente.nombre} {paciente.apellidoPaterno} {paciente.apellidoMaterno ?? ""}</p>
          <p><span className="text-slate-400">Número de expediente</span><br />{paciente.numeroExpediente}</p>
          <p><span className="text-slate-400">Fecha de nacimiento</span><br />{paciente.fechaNacimiento.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Foto de perfil" />
        <CardBody>
          <FotoPropiaForm fotoActual={paciente.fotoUrl} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Datos de contacto" subtitle="Se usan para localizarlo y para enviarle su información." />
        <CardBody>
          <PerfilPacienteForm paciente={paciente} />
        </CardBody>
      </Card>
    </div>
  );
}
