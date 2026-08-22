import Link from "next/link";
import { PricingTabs } from "../PricingTabs";

export default function PreciosPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-base font-bold text-white">
              N
            </div>
            <span className="text-lg font-bold text-slate-900">NovaMed</span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-center text-4xl font-bold text-slate-900">
            Planes simples, sin letras chiquitas
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            Empieza gratis y escala cuando tu consultorio lo necesite
          </p>
          <div className="mt-10">
            <PricingTabs />
          </div>
        </div>
      </section>
    </main>
  );
}
