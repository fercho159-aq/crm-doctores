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

          {/* Trust strip */}
          <div className="mx-auto mt-14 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/10 pt-8">
            <div className="flex items-center gap-2 text-sm text-blue-200/70">
              <span className="text-lg">🏥</span> Clínicas y consultorios
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-200/70">
              <span className="text-lg">🔒</span> Datos cifrados
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-200/70">
              <span className="text-lg">📋</span> NOM-004 compliant
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-200/70">
              <span className="text-lg">🇲🇽</span> Hecho en México
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <section className="border-b border-slate-200 bg-white px-6 py-16 sm:py-20">
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

      {/* Why NovaMed — visual feature section */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              ¿Por qué NovaMed?
            </p>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Todo lo que necesitas para cumplir la norma
            </h2>
          </div>

          {/* Bento grid */}
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Big card — Video */}
            <div className="row-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:col-span-1">
              <div className="aspect-[9/16] w-full">
                <iframe
                  src="https://www.youtube.com/embed/CrnrU4wFhIY"
                  title="COFEPRIS - Expediente Clínico Electrónico"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              </div>
              <div className="p-4 text-center">
                <p className="text-xs font-medium text-slate-400">📺 Video informativo — COFEPRIS</p>
              </div>
            </div>

            {/* Feature cards */}
            <BentoCard
              icon="📋"
              color="bg-blue-100"
              title="Historia clínica digital"
              description="Ficha de identificación, antecedentes, exploración física y diagnóstico — NOM-004, sección 6.1."
            />
            <BentoCard
              icon="📝"
              color="bg-indigo-100"
              title="Notas inmutables"
              description="Una vez firmadas no se borran. Solo adendas, como exige la norma. Protección legal total."
            />
            <BentoCard
              icon="💊"
              color="bg-rose-100"
              title="Recetas en PDF"
              description="Con cédula profesional, dosis, vía de administración. Se envían al correo del paciente automáticamente."
            />
            <BentoCard
              icon="🏥"
              color="bg-teal-100"
              title="Expediente quirúrgico"
              description="Notas pre (8.5) y postoperatorias (8.8). Hojas de consumo e insumos por procedimiento."
            />

            {/* Wide card — NOM */}
            <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 sm:col-span-2 lg:col-span-1">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                ⚖️
              </div>
              <h3 className="text-lg font-semibold text-slate-900">NOM-004-SSA3-2012</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Publicada en el Diario Oficial de la Federación.
                Aplica a <strong className="text-slate-700">todo sector público, social y privado</strong>.
                Multas y clausura por incumplimiento.
              </p>
              <a
                href="https://dof.gob.mx/nota_detalle_popup.php?codigo=5272787"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800"
              >
                Leer en el DOF <span>→</span>
              </a>
            </div>
          </div>

          {/* Extra trust row */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard icon="🔒" value="256-bit" label="Cifrado de datos" />
            <StatCard icon="📦" value="5 años" label="Respaldos automáticos" />
            <StatCard icon="👥" value="Roles" label="Doctor, enfermería, admin" />
            <StatCard icon="📧" value="Alertas" label="Email automático" />
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

function BentoCard({ icon, color, title, description }: { icon: string; color: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${color} text-2xl`}>
        {icon}
      </div>
      <h3 className="mb-1.5 text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="text-2xl">{icon}</div>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
