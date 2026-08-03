import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/actions/auth";
import { Badge } from "@/components/ui";
import { IdleLogout } from "@/components/IdleLogout";

const NAV: Record<string, { href: string; label: string }[]> = {
  ADMIN: [
    { href: "/admin", label: "Panel" },
    { href: "/pacientes", label: "Pacientes" },
    { href: "/admin/doctores", label: "Doctores" },
    { href: "/admin/usuarios", label: "Usuarios" },
    { href: "/admin/especialidades", label: "Especialidades" },
    { href: "/admin/correos", label: "Correos" },
    { href: "/admin/bitacora", label: "Bitácora" },
    { href: "/admin/configuracion", label: "Configuración" },
  ],
  DOCTOR: [
    { href: "/mi-consulta", label: "Mi consulta" },
    { href: "/mi-consulta/disponibles", label: "Pacientes disponibles" },
    { href: "/pacientes", label: "Mis pacientes" },
  ],
  ENFERMERIA: [
    { href: "/enfermeria", label: "Inicio" },
    { href: "/enfermeria/registrar", label: "Registrar paciente" },
  ],
  ANESTESIOLOGO: [
    { href: "/anestesiologia", label: "Inicio" },
  ],
};

const ROL_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  DOCTOR: "Doctor(a)",
  ENFERMERIA: "Enfermería",
  ANESTESIOLOGO: "Anestesiólogo(a)",
};

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/login");
  if (user.debeCambiarPassword) redirect("/cambiar-password");

  return (
    <div className="min-h-screen">
      <IdleLogout minutes={15} />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-blue-800">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700 text-sm text-white">M</span>
              <span className="hidden sm:inline">MIT Medical Tower</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1">
              {(NAV[user.rol] ?? []).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-800"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{user.nombreCompleto}</p>
              <Badge tone="blue">{ROL_LABEL[user.rol]}</Badge>
            </div>
            <form action={logoutAction}>
              <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
