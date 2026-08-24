import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { Badge } from "@/components/ui";
import { IdleLogout } from "@/components/IdleLogout";

const NAV = [
  { href: "/portal", label: "Inicio" },
  { href: "/portal/expediente", label: "Mi expediente" },
  { href: "/portal/consultas", label: "Consultas" },
  { href: "/portal/recetas", label: "Mis recetas" },
  { href: "/portal/documentos", label: "Mis documentos" },
  { href: "/portal/citas", label: "Citas" },
  { href: "/portal/mi-perfil", label: "Mi perfil" },
];

// Área exclusiva de pacientes: nunca reutiliza el nav de personal de
// (protected)/layout.tsx, para no exponer módulos administrativos/clínicos
// internos (bitácora, otros pacientes, configuración, etc. — §16 del plan).
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.rol !== "PACIENTE") redirect("/");
  if (user.debeCambiarPassword) redirect("/cambiar-password");

  return (
    <div className="min-h-screen bg-slate-50">
      <IdleLogout minutes={20} />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/portal" className="flex items-center gap-2 font-bold text-blue-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-sm text-white">+</span>
            <span>Mi salud</span>
          </Link>
          <div className="flex items-center gap-3">
            <Badge tone="blue">{user.nombreCompleto}</Badge>
            <form action={logoutAction}>
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                Salir
              </button>
            </form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-4xl flex-wrap gap-1 px-4 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
    </div>
  );
}
