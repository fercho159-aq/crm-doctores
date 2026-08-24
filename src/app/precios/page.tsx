import { LandingNav } from "../LandingNav";
import { PricingTabs } from "../PricingTabs";

export default function PreciosPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <LandingNav />

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
