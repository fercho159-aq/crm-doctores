import Link from "next/link";
import { LandingNav } from "../../LandingNav";

export default function LaboratoriosPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <LandingNav />

      <section className="px-6 py-20 sm:py-32">
        <div className="mx-auto max-w-lg text-center">
          <div className="text-6xl">🔬</div>
          <h1 className="mt-6 text-3xl font-bold text-slate-900">
            NovaMed para Laboratorios
          </h1>
          <p className="mt-4 text-lg text-slate-500">
            Gestión de muestras, resultados y reportes para laboratorios clínicos.
            Estamos desarrollando esta solución.
          </p>
          <div className="mx-auto mt-8 flex max-w-sm gap-2">
            <input
              type="email"
              placeholder="tu@correo.com"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button className="shrink-0 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800">
              Avísame
            </button>
          </div>
          <p className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            🚧 Próximamente
          </p>
          <div className="mt-8">
            <Link href="/" className="text-sm font-medium text-blue-700 hover:text-blue-800">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
