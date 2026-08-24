import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, Input, Button, Select } from "@/components/ui";

export default async function BitacoraPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; accion?: string; fecha?: string }>;
}) {
  const admin = await requireRole("ADMIN");
  const { q, accion, fecha } = await searchParams;

  const registros = await db.bitacora.findMany({
    where: {
      usuario: {
        workspaceId: admin.workspaceId,
        ...(q ? { nombreCompleto: { contains: q, mode: "insensitive" } } : {}),
      },
      ...(accion ? { accion } : {}),
      ...(fecha
        ? {
            fechaHora: {
              gte: new Date(`${fecha}T00:00:00`),
              lt: new Date(new Date(`${fecha}T00:00:00`).getTime() + 86_400_000),
            },
          }
        : {}),
    },
    include: { usuario: true },
    orderBy: { fechaHora: "desc" },
    take: 200,
  });

  const acciones = [
    "LOGIN", "LOGIN_FALLIDO", "CREAR", "FIRMAR", "ADENDAR", "CANCELAR", "CONSULTAR_EXPEDIENTE",
    "ENVIAR_RECETA", "TOMAR_PACIENTE", "ALTA", "CERRAR",
    // Portal del paciente
    "INVITAR_PORTAL", "ACTIVAR_PORTAL", "CONSULTAR_PORTAL", "ACTUALIZAR_PERFIL_PACIENTE",
    "APORTAR_INFORMACION", "REVISAR_APORTACION",
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Bitácora de actividad</h1>
      <form className="flex flex-wrap gap-2" action="/admin/bitacora" method="GET">
        <Input name="q" defaultValue={q} placeholder="Usuario…" className="w-56" />
        <Select name="accion" defaultValue={accion ?? ""} className="w-56">
          <option value="">Todas las acciones</option>
          {acciones.map((a) => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Input name="fecha" type="date" defaultValue={fecha} className="w-44" />
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>
      <Card>
        <CardHeader title={`${registros.length} registro(s)`} subtitle="Solo lectura. La bitácora es append-only: no admite ediciones ni borrados." />
        <CardBody className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3">Fecha/hora</th>
                <th className="py-2 pr-3">Usuario</th>
                <th className="py-2 pr-3">Rol</th>
                <th className="py-2 pr-3">Acción</th>
                <th className="py-2 pr-3">Entidad</th>
                <th className="py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((b) => (
                <tr key={String(b.id)} className="border-b border-slate-50">
                  <td className="whitespace-nowrap py-2 pr-3 text-slate-500">
                    {b.fechaHora.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
                  </td>
                  <td className="py-2 pr-3">{b.usuario?.nombreCompleto ?? "—"}</td>
                  <td className="py-2 pr-3">{b.rolSnapshot ?? "—"}</td>
                  <td className="py-2 pr-3 font-medium">{b.accion}</td>
                  <td className="py-2 pr-3">{b.entidad}</td>
                  <td className="py-2 text-slate-400">{b.ipOrigen ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
