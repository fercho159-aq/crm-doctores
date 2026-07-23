import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { toggleEspecialidad } from "@/actions/admin";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import { NuevaEspecialidadForm } from "./NuevaEspecialidadForm";

export default async function EspecialidadesPage() {
  await requireRole("ADMIN");
  const especialidades = await db.especialidad.findMany({
    include: { _count: { select: { doctores: true, asignaciones: true } } },
    orderBy: { nombre: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Especialidades</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody>
            <div className="divide-y divide-slate-100">
              {especialidades.map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {e.nombre} {!e.activa && <Badge tone="slate">Inactiva</Badge>}
                    </p>
                    <p className="text-sm text-slate-500">
                      {e._count.doctores} doctor(es) · {e._count.asignaciones} episodio(s)
                    </p>
                  </div>
                  <form action={toggleEspecialidad.bind(null, e.id)}>
                    <Button size="sm" variant="secondary">{e.activa ? "Desactivar" : "Activar"}</Button>
                  </form>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Nueva especialidad" />
          <CardBody>
            <NuevaEspecialidadForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
