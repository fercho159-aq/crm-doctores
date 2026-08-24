import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

const SUPERADMIN_EMAIL = "info@novamedics.com.mx";

const PLAN_LABELS: Record<string, { nombre: string; precio: string; color: string }> = {
  BASIC: { nombre: "Receta", precio: "Gratis", color: "bg-emerald-100 text-emerald-700" },
  CLINIC: { nombre: "Clínica Pro", precio: "$699/mes", color: "bg-purple-100 text-purple-700" },
};

export default async function PlanDetailPage({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  const user = await getSession();
  if (!user || user.email !== SUPERADMIN_EMAIL) redirect("/mi-consulta");

  const tipoUpper = tipo.toUpperCase() as "BASIC" | "CLINIC";
  const plan = PLAN_LABELS[tipoUpper];
  if (!plan) redirect("/superadmin");

  const usuarios = await db.usuario.findMany({
    where: { workspace: { tipo: tipoUpper } },
    include: {
      workspace: true,
      doctor: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/superadmin" className="text-sm text-blue-700 hover:underline">← Dashboard</Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Plan {plan.nombre}</h1>
        <p className="text-sm text-slate-500">{plan.precio} — {usuarios.length} usuario(s)</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Nombre</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Consultorio</th>
                <th className="px-6 py-3">Cédula</th>
                <th className="px-6 py-3">Método</th>
                <th className="px-6 py-3">Último acceso</th>
                <th className="px-6 py-3">Registro</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-900">{u.nombreCompleto}</td>
                  <td className="px-6 py-3 text-slate-600">{u.email}</td>
                  <td className="px-6 py-3 text-slate-600">{u.workspace.nombre}</td>
                  <td className="px-6 py-3 text-slate-500">{u.doctor?.cedulaProfesional || "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      u.passwordHash === "GOOGLE_OAUTH" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      {u.passwordHash === "GOOGLE_OAUTH" ? "Google" : "Correo"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {u.ultimoAcceso
                      ? u.ultimoAcceso.toLocaleDateString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
                      : "Nunca"}
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {u.createdAt.toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No hay usuarios en este plan</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
