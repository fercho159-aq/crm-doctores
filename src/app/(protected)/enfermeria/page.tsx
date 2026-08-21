import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { nuevaVisita } from "@/actions/enfermeria";
import { Card, CardHeader, CardBody, StatCard, Badge, EmptyState, Input, Button } from "@/components/ui";

export default async function EnfermeriaHome({ searchParams }: { searchParams: Promise<{ q?: string; disponible?: string }> }) {
  const user = await requireRole("ENFERMERIA", "ADMIN");
  const { q, disponible } = await searchParams;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [registrosHoy, borradores, resultados] = await Promise.all([
    db.hojaPrimerLlenado.count({ where: { fechaHoraCaptura: { gte: hoy }, estado: "CERRADA" } }),
    db.hojaPrimerLlenado.findMany({
      where: { estado: "BORRADOR", capturadoPorId: user.id },
      include: { paciente: true },
      orderBy: { fechaHoraCaptura: "desc" },
      take: 10,
    }),
    q
      ? db.paciente.findMany({
          where: {
            activo: true,
            workspaceId: user.workspaceId,
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { apellidoPaterno: { contains: q, mode: "insensitive" } },
              { curp: { contains: q, mode: "insensitive" } },
              { telefono: { contains: q } },
              { numeroExpediente: { contains: q, mode: "insensitive" } },
            ],
          },
          take: 15,
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      {disponible && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          Paciente guardado y puesto <strong>disponible para consulta</strong>.
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Enfermería — Primer llenado</h1>
        <Link href="/enfermeria/registrar">
          <Button>+ Registrar nuevo paciente</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Registros cerrados hoy" value={registrosHoy} tone="green" />
        <StatCard label="Borradores pendientes" value={borradores.length} tone="amber" />
      </div>

      <Card>
        <CardHeader
          title="Buscar paciente antes de registrar"
          subtitle="Evite duplicados: busque por nombre, CURP, teléfono o número de expediente."
        />
        <CardBody>
          <form className="flex gap-2" action="/enfermeria" method="GET">
            <Input name="q" defaultValue={q} placeholder="Nombre, CURP, teléfono o MIT-2026-00001…" />
            <Button type="submit" variant="secondary">Buscar</Button>
          </form>
          {q && (
            <div className="mt-4 divide-y divide-slate-100">
              {resultados.length === 0 && (
                <EmptyState
                  title={`Sin resultados para «${q}». Puede registrarlo como paciente nuevo.`}
                  action={<Link href="/enfermeria/registrar"><Button size="sm">Registrar nuevo paciente</Button></Link>}
                />
              )}
              {resultados.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {p.nombre} {p.apellidoPaterno} {p.apellidoMaterno}
                    </p>
                    <p className="text-sm text-slate-500">
                      {p.numeroExpediente} · Nac. {p.fechaNacimiento.toLocaleDateString("es-MX", { timeZone: "UTC" })} · Tel {p.telefono}
                    </p>
                  </div>
                  <form action={nuevaVisita.bind(null, p.id)}>
                    <Button size="sm" variant="secondary">Nueva visita</Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Mis borradores" subtitle="Hojas de primer llenado sin cerrar." />
        <CardBody>
          {borradores.length === 0 ? (
            <EmptyState title="No tiene borradores pendientes." />
          ) : (
            <div className="divide-y divide-slate-100">
              {borradores.map((h) => (
                <div key={h.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium text-slate-800">
                      {h.paciente.nombre} {h.paciente.apellidoPaterno} <Badge tone="amber">Borrador v{h.version}</Badge>
                    </p>
                    <p className="text-sm text-slate-500">{h.paciente.numeroExpediente}</p>
                  </div>
                  <Link href={`/enfermeria/hoja/${h.pacienteId}`}>
                    <Button size="sm">Continuar</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
