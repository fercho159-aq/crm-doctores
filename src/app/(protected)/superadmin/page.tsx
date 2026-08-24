import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const SUPERADMIN_EMAIL = "info@novamedics.com.mx";

export default async function SuperadminPage() {
  const user = await getSession();
  if (!user || user.email !== SUPERADMIN_EMAIL) redirect("/mi-consulta");

  const [
    totalWorkspaces,
    totalUsuarios,
    totalPacientes,
    totalRecetas,
    registrosHoy,
    registrosGoogle,
    usuariosRecientes,
  ] = await Promise.all([
    db.workspace.count(),
    db.usuario.count(),
    db.paciente.count(),
    db.receta.count(),
    db.usuario.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    db.usuario.count({ where: { passwordHash: "GOOGLE_OAUTH" } }),
    db.usuario.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { workspace: true },
    }),
  ]);

  const usuariosNormales = totalUsuarios - registrosGoogle;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel Superadmin</h1>
        <p className="text-sm text-slate-500">Vista general de NovaMedics</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Consultorios" value={totalWorkspaces} icon="🏥" />
        <StatCard label="Usuarios" value={totalUsuarios} icon="👤" />
        <StatCard label="Pacientes" value={totalPacientes} icon="📋" />
        <StatCard label="Recetas emitidas" value={totalRecetas} icon="💊" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Registros hoy" value={registrosHoy} icon="📈" />
        <StatCard label="Login con Google" value={registrosGoogle} icon="🔵" />
        <StatCard label="Login con correo" value={usuariosNormales} icon="✉️" />
      </div>

      {/* Usuarios recientes */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Últimos registros</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Rol</th>
                <th className="px-6 py-3">Consultorio</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Registro</th>
                <th className="px-6 py-3">Método</th>
              </tr>
            </thead>
            <tbody>
              {usuariosRecientes.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">{u.nombreCompleto}</td>
                  <td className="px-6 py-3 text-slate-600">{u.email}</td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{u.workspace.nombre}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.workspace.tipo === "BASIC" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"
                    }`}>
                      {u.workspace.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {u.createdAt.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.passwordHash === "GOOGLE_OAUTH" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {u.passwordHash === "GOOGLE_OAUTH" ? "Google" : "Correo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}
