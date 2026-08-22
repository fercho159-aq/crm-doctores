import Link from "next/link";
import { TestimonialCarousel } from "./TestimonialCarousel";
import { LandingNav } from "./LandingNav";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <LandingNav />

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-medium text-amber-300">
            <span>⚖️</span>
            <span>Obligatorio según NOM-004-SSA3-2012</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
            Tu expediente clínico
            <span className="block text-blue-300">electrónico y legal</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-blue-100/80">
            La Secretaría de Salud exige a <strong className="text-white">todo consultorio, clínica y hospital</strong> llevar
            expediente clínico conforme a la norma. NovaMed te permite cumplir desde el primer paciente
            — sin papeleo, sin riesgo de sanciones.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="w-full rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50 sm:w-auto"
            >
              Comenzar gratis
            </Link>
            <Link
              href="/login"
              className="w-full rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* NOM-004 + Features (merged section) */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          {/* DOF compact excerpt */}
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md">
            <div className="bg-gradient-to-r from-green-900 to-green-800 px-5 py-2.5">
              <p className="text-xs font-bold tracking-wide text-white">
                NORMA Oficial Mexicana NOM-004-SSA3-2012, Del expediente clínico
              </p>
            </div>
            <div className="px-5 py-4 font-serif text-sm leading-relaxed text-slate-600">
              <p className="text-justify">
                Establece los criterios científicos, éticos y administrativos <strong className="text-slate-900">obligatorios</strong> para
                la elaboración, uso y conservación del expediente clínico. Aplica a todos los establecimientos
                de atención médica de los sectores <strong className="text-slate-900">público, social y privado</strong>.
                Su incumplimiento puede derivar en sanciones, multas e incluso clausura.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs font-medium text-amber-700">
                <span>✓ Conservación mínima 5 años</span>
                <span>✓ Obligatorio para todo personal de salud</span>
                <span>✓ Datos confidenciales del paciente</span>
              </div>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-2.5 text-center">
              <a
                href="https://dof.gob.mx/nota_detalle_popup.php?codigo=5272787"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-700 hover:text-blue-800"
              >
                Leer norma completa en el DOF →
              </a>
            </div>
          </div>

          {/* Features grid */}
          <div className="mt-14 text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Todo lo que la norma exige,
              <span className="text-blue-700"> en un solo sistema</span>
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="📋"
              title="Historia clínica"
              description="Ficha de identificación, antecedentes, exploración física y diagnóstico — conforme a la NOM-004 (6.1)."
            />
            <FeatureCard
              icon="📝"
              title="Notas de evolución"
              description="Notas inmutables una vez firmadas. Solo adendas, nunca borrado — como exige la norma."
            />
            <FeatureCard
              icon="💊"
              title="Recetas digitales"
              description="PDF con cédula profesional, dosis y vía de administración. Se envía al correo del paciente."
            />
            <FeatureCard
              icon="🏥"
              title="Expediente quirúrgico"
              description="Notas preoperatorias (8.5) y postoperatorias (8.8). Hojas de consumo por procedimiento."
            />
            <FeatureCard
              icon="🔒"
              title="Seguridad y roles"
              description="Acceso por roles, bitácora de auditoría y datos protegidos conforme a la LFPDPPP."
            />
            <FeatureCard
              icon="📦"
              title="Respaldos 5 años"
              description="Respaldos cifrados automáticos. Cumple la conservación mínima que exige la norma."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-200 bg-gradient-to-b from-blue-50 to-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Así de fácil funciona
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            En 3 pasos ya estás cumpliendo con la norma
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="relative rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
              <div className="absolute -top-4 left-6 flex h-8 items-center rounded-full bg-blue-700 px-3 text-xs font-bold text-white">
                Paso 1
              </div>
              <div className="mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                🏥
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Crea tu consultorio</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Regístrate gratis en menos de 2 minutos. Configura datos, especialidades y cédula profesional.
              </p>
            </div>

            <div className="relative rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
              <div className="absolute -top-4 left-6 flex h-8 items-center rounded-full bg-teal-600 px-3 text-xs font-bold text-white">
                Paso 2
              </div>
              <div className="mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-3xl">
                👤
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Registra pacientes</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Captura la historia clínica completa que pide la NOM-004 con todos los campos obligatorios.
              </p>
            </div>

            <div className="relative rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
              <div className="absolute -top-4 left-6 flex h-8 items-center rounded-full bg-indigo-600 px-3 text-xs font-bold text-white">
                Paso 3
              </div>
              <div className="mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-3xl">
                📄
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Consulta y receta</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Notas de evolución, recetas PDF profesionales y envío automático al correo del paciente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="border-t border-slate-200 bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Lo que dicen los doctores
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            Médicos que ya digitalizaron su consultorio con NovaMed
          </p>
          <div className="mt-12">
            <TestimonialCarousel />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-blue-800 to-blue-900 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            No esperes a que te lo pidan en una inspección
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-blue-100/80">
            Cumple con la NOM-004 desde hoy. Comienza gratis y sin compromiso.
          </p>
          <div className="mt-8">
            <Link
              href="/registro"
              className="inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
            >
              Crear mi consultorio gratis
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-slate-400">
          <p className="font-medium text-slate-600">NovaMed — Expediente Clínico Electrónico</p>
          <p className="mt-1">Hecho en México por MAW Soluciones</p>
          <p className="mt-3 text-xs">
            Conforme a la NOM-004-SSA3-2012, Ley General de Salud y LFPDPPP.
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}
