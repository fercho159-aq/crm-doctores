import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { toggleUsuario } from "@/actions/admin";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import { NuevoDoctorForm, FirmaDoctorForm } from "./Forms";

export default async function DoctoresPage() {
  await requireRole("ADMIN");
  const [doctores, especialidades] = await Promise.all([
    db.doctor.findMany({
      include: { usuario: true, especialidades: { include: { especialidad: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.especialidad.findMany({ where: { activa: true }, orderBy: { nombre: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Doctores</h1>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Catálogo" subtitle="La cédula profesional es obligatoria: sin ella no se emiten recetas." />
          <CardBody>
            <div className="divide-y divide-slate-100">
              {doctores.length === 0 && <p className="py-2 text-sm text-slate-500">Sin doctores registrados.</p>}
              {doctores.map((d) => (
                <div key={d.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {d.usuario.nombreCompleto} {!d.usuario.activo && <Badge tone="red">Inactivo</Badge>}
                      </p>
                      <p className="text-sm text-slate-500">
                        {d.usuario.email} · Céd. {d.cedulaProfesional} · {d.institucionTitulo}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {d.especialidades.map((de) => (
                          <Badge key={de.especialidadId} tone="blue">{de.especialidad.nombre}</Badge>
                        ))}
                        {d.firmaDigitalizada ? <Badge tone="green">Firma cargada</Badge> : <Badge tone="amber">Sin firma digitalizada</Badge>}
                      </div>
                    </div>
                    <form action={toggleUsuario.bind(null, d.usuarioId)}>
                      <Button size="sm" variant="secondary">{d.usuario.activo ? "Desactivar" : "Activar"}</Button>
                    </form>
                  </div>
                  <FirmaDoctorForm doctorId={d.id} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Alta de doctor" subtitle="Genera cuenta con contraseña temporal (cambio obligatorio al primer ingreso)." />
          <CardBody>
            <NuevoDoctorForm especialidades={especialidades.map((e) => ({ id: e.id, nombre: e.nombre }))} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
