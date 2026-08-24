import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardBody, Badge, EmptyState } from "@/components/ui";
import { cargarPacientePropio } from "../paciente";

export default async function MisRecetas() {
  const { paciente } = await cargarPacientePropio({ sinBitacora: true });

  const recetas = await db.receta.findMany({
    where: { asignacion: { pacienteId: paciente.id } },
    orderBy: { fechaEmision: "desc" },
    include: { asignacion: { include: { doctor: { include: { usuario: true } }, especialidad: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Mis recetas</h1>
      {recetas.length === 0 ? (
        <EmptyState title="Aún no tiene recetas." />
      ) : (
        <Card>
          <div className="divide-y divide-slate-100">
            {recetas.map((r) => (
              <Link key={r.id} href={`/portal/recetas/${r.id}`} className="block hover:bg-slate-50">
                <CardBody className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-800">{r.folio}</p>
                    <p className="text-sm text-slate-500">
                      {r.fechaEmision.toLocaleDateString("es-MX", { timeZone: "America/Mexico_City" })} ·{" "}
                      {r.asignacion.doctor.usuario.nombreCompleto} ({r.asignacion.especialidad.nombre})
                    </p>
                  </div>
                  <Badge tone={r.estado === "CANCELADA" ? "red" : "green"}>
                    {r.estado === "CANCELADA" ? "Cancelada" : "Vigente"}
                  </Badge>
                </CardBody>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
