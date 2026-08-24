import Link from "next/link";
import { TestimonialCarousel } from "./TestimonialCarousel";
import { LandingNav } from "./LandingNav";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <LandingNav />

      {/* Hero — estilo brochure */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800 px-6 py-16 sm:py-24">
        {/* Decoración de fondo */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          {/* Columna izquierda — Texto */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-300/30 bg-blue-500/20 px-4 py-1.5 text-sm font-semibold text-blue-100">
              <span>¿POR QUÉ NOVAMEDICS?</span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
              El expediente clínico digital que tu consultorio necesita
              <span className="block mt-2 text-amber-300 italic">— y que la ley exige</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-blue-100/80 sm:text-lg">
              La <strong className="text-white">NOM-004-SSA3-2012</strong> obliga a todo consultorio, clínica y hospital en México a llevar expediente clínico.
              Su incumplimiento puede derivar en <strong className="text-white">multas y clausura</strong>.
            </p>
            <p className="mt-3 text-base font-medium text-blue-200">
              NovaMedics te permite cumplir desde el primer paciente.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/precios"
                className="rounded-xl bg-white px-8 py-3.5 text-center text-base font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
              >
                Empezar prueba
              </Link>
              <Link
                href="/login"
                className="rounded-xl border-2 border-white/30 px-8 py-3.5 text-center text-base font-semibold text-white transition hover:bg-white/10"
              >
                Ya tengo cuenta
              </Link>
            </div>
          </div>

          {/* Columna derecha — Visual del documento + COFEPRIS */}
          <div className="relative mx-auto max-w-md lg:mx-0">
            {/* Badge rojo "¡La autoridad ya lo solicita!" */}
            <div className="absolute -right-2 -top-3 z-20 rotate-3 rounded-lg bg-red-600 px-4 py-2 shadow-xl">
              <p className="text-sm font-extrabold text-white">¡La autoridad ya lo solicita!</p>
              <p className="text-xs font-medium text-red-200">En vigor este año</p>
            </div>

            {/* Documento de la NOM simulado */}
            <div className="relative rounded-xl bg-white p-5 shadow-2xl ring-1 ring-black/5">
              <div className="mb-3 border-b border-slate-200 pb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">NORMA Oficial Mexicana NOM-004-SSA3-2012</p>
                <p className="mt-1 text-[9px] leading-snug text-slate-400">Del expediente clínico.</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] leading-relaxed text-slate-500">
                  Al margen un sello con el Escudo Nacional, que dice: Estados Unidos Mexicanos.- Secretaría de Salud.
                </p>
                <p className="text-[9px] leading-relaxed text-slate-500">
                  GERMÁN ENRIQUE FAJARDO DOLCI, Subsecretario de Integración y Desarrollo del Sector Salud y Presidente del Comité Consultivo Nacional de Normalización...
                </p>
                <p className="text-[9px] leading-relaxed text-slate-500">
                  Que con fecha 5 de octubre de 2010, fue publicado en el Diario Oficial de la Federación el Proyecto de Modificación de esta norma, en cumplimiento de la aprobación...
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📋</span>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Diario Oficial</p>
                    <p className="text-[10px] text-slate-400">de la Federación</p>
                  </div>
                </div>
                <a
                  href="https://dof.gob.mx/nota_detalle_popup.php?codigo=5272787"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-blue-700"
                >
                  Leer NOM →
                </a>
              </div>
            </div>

            {/* Badge de COFEPRIS */}
            <div className="absolute -bottom-5 -left-4 z-10 flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-xl ring-1 ring-black/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                <span className="text-lg">🏛️</span>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">COFEPRIS</p>
                <p className="text-[10px] text-slate-500">Comisión Federal para la Protección<br/>contra Riesgos Sanitarios</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="relative mx-auto mt-20 flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-white/10 pt-8">
          <div className="flex items-center gap-2 text-sm text-blue-200/70"><span className="text-lg">🏥</span> Clínicas y consultorios</div>
          <div className="flex items-center gap-2 text-sm text-blue-200/70"><span className="text-lg">🔒</span> Datos cifrados</div>
          <div className="flex items-center gap-2 text-sm text-blue-200/70"><span className="text-lg">📋</span> NOM-004 compliant</div>
          <div className="flex items-center gap-2 text-sm text-blue-200/70"><span className="text-lg">🇲🇽</span> Hecho en México</div>
        </div>
      </section>

      {/* Why NovaMedics — visual feature section */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              ¿Por qué NovaMedics?
            </p>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 sm:text-4xl">
              Todo lo que necesitas para cumplir la norma
            </h2>
          </div>

          {/* Video + features side by side */}
          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {/* Video */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                <p className="text-xs font-medium text-slate-400">Video informativo — COFEPRIS</p>
              </div>
            </div>

            {/* Feature bullets */}
            <div className="flex flex-col justify-center">
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-sm">📋</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Historia clínica digital</p>
                    <p className="text-sm text-slate-500">Antecedentes, exploración física y diagnóstico — NOM-004, 6.1.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm">📝</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Notas inmutables</p>
                    <p className="text-sm text-slate-500">Una vez firmadas no se borran. Solo adendas. Protección legal.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-sm">💊</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Recetas en PDF</p>
                    <p className="text-sm text-slate-500">Con cédula profesional y dosis. Envío automático al paciente.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-sm">🏥</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Expediente quirúrgico</p>
                    <p className="text-sm text-slate-500">Notas pre y postoperatorias. Hojas de consumo e insumos.</p>
                  </div>
                </li>
              </ul>

              {/* NOM banner — justo debajo de los bullets */}
              <div className="mt-6 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-white p-4">
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-xl">
                    ⚖️
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900">NOM-004-SSA3-2012 — Diario Oficial de la Federación</h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Aplica a <strong className="text-slate-700">todo sector público, social y privado</strong>. Multas y clausura por incumplimiento.
                    </p>
                  </div>
                  <a
                    href="https://dof.gob.mx/nota_detalle_popup.php?codigo=5272787"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 rounded-lg border border-green-300 px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50"
                  >
                    Leer en el DOF →
                  </a>
                </div>
              </div>
            </div>
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
      <section className="bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-white">
            Lo que dicen los doctores
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-blue-200/70">
            Médicos que ya digitalizaron su consultorio con NovaMedics
          </p>
          <div className="mt-12">
            <TestimonialCarousel />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto max-w-5xl text-center text-sm text-slate-400">
          <p className="font-medium text-slate-600">NovaMedics — Expediente Clínico Electrónico</p>
          <p className="mt-1">Hecho en México por MAW Soluciones</p>
          <p className="mt-3 text-xs">
            Conforme a la NOM-004-SSA3-2012, Ley General de Salud y LFPDPPP.
          </p>
        </div>
      </footer>
    </main>
  );
}


