import Link from "next/link";
import { requireRole, wherePacientesDeDoctor } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card, CardBody, EmptyState, Input, Button, Badge } from "@/components/ui";

export default async function PacientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireRole("ADMIN", "DOCTOR");
  const { q } = await searchParams;

  const where = {
    activo: true,
    ...(user.rol === "DOCTOR" ? wherePacientesDeDoctor(user.doctorId!) : {}),
    ...(q
      ? {
          OR: [
            { nombre: { contains: q, mode: "insensitive" as const } },
            { apellidoPaterno: { contains: q, mode: "insensitive" as const } },
            { curp: { contains: q, mode: "insensitive" as const } },
            { numeroExpediente: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const pacientes = await db.paciente.findMany({
    where,
    include: { asignaciones: { where: { estado: "ACTIVA" }, include: { especialidad: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        {user.rol === "ADMIN" ? "Listado global de pacientes" : "Mis pacientes"}
      </h1>
      <form className="flex max-w-md gap-2" action="/pacientes" method="GET">
        <Input name="q" defaultValue={q} placeholder="Nombre, CURP o expediente…" />
        <Button type="submit" variant="secondary">Buscar</Button>
      </form>
      <Card>
        <CardBody>
          {pacientes.length === 0 ? (
            <EmptyState title="Sin pacientes." />
          ) : (
            <div className="divide-y divide-slate-100">
              {pacientes.map((p) => (
                <Link
                  key={p.id}
                  href={`/pacientes/${p.id}`}
                  className="flex items-center justify-between gap-3 py-3 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {p.nombre} {p.apellidoPaterno} {p.apellidoMaterno}
                    </p>
                    <p className="text-sm text-slate-500">{p.numeroExpediente}</p>
                  </div>
                  <div className="flex gap-1">
                    {p.asignaciones.map((a) => (
                      <Badge key={a.id} tone="blue">{a.especialidad.nombre}</Badge>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
