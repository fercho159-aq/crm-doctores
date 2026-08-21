import Link from "next/link";
import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, StatCard, EmptyState } from "@/components/ui";

export default async function AdminHome() {
  const user = await requireRole("ADMIN");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const wsPaciente = { asignacion: { paciente: { workspaceId: user.workspaceId } } };
  const [pacientes, consultasHoy, recetas, cirugias, correosFallidos, actividad] = await Promise.all([
    db.paciente.count({ where: { activo: true, workspaceId: user.workspaceId } }),
    db.notaEvolucion.count({ where: { fechaHora: { gte: hoy }, ...wsPaciente } }),
    db.receta.count({ where: { estado: "EMITIDA", ...wsPaciente } }),
    db.expedienteQuirurgico.count({ where: { paciente: { workspaceId: user.workspaceId } } }),
    db.receta.count({ where: { estadoEnvio: "ERROR", ...wsPaciente } }),
    db.bitacora.findMany({
      where: { usuario: { workspaceId: user.workspaceId } },
      orderBy: { fechaHora: "desc" },
      take: 12,
      include: { usuario: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Panel administrativo</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Pacientes" value={pacientes} />
        <StatCard label="Notas hoy" value={consultasHoy} tone="green" />
        <StatCard label="Recetas emitidas" value={recetas} />
        <StatCard label="Cirugías" value={cirugias} />
        <StatCard label="Correos fallidos" value={correosFallidos} tone={correosFallidos > 0 ? "red" : "green"} />
      </div>

      {correosFallidos > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
          Hay {correosFallidos} receta(s) con error de envío.{" "}
          <Link href="/admin/correos" className="font-semibold underline">Revisar monitor de correos</Link>
        </div>
      )}

      <Card>
        <CardHeader title="Actividad reciente" subtitle="Últimos movimientos de la bitácora." />
        <CardBody>
          {actividad.length === 0 ? (
            <EmptyState title="Sin actividad." />
          ) : (
            <div className="divide-y divide-slate-100 text-sm">
              {actividad.map((b) => (
                <div key={String(b.id)} className="flex justify-between gap-3 py-2">
                  <p className="text-slate-700">
                    <strong>{b.usuario?.nombreCompleto ?? "Sistema"}</strong> · {b.accion} · {b.entidad}
                  </p>
                  <p className="whitespace-nowrap text-slate-400">
                    {b.fechaHora.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
