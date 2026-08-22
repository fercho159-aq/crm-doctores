import Link from "next/link";
import { TestimonialCarousel } from "./TestimonialCarousel";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 text-base font-bold text-white">
              N
            </div>
            <span className="text-lg font-bold text-slate-900">NovaMed</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/registro"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:inline-flex"
            >
              Crear consultorio
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </header>

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

      {/* Regulatory Banner */}
      <section className="border-b border-slate-200 bg-white px-6 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-2xl">
                📜
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  ¿Sabías que el expediente clínico electrónico es obligatorio?
                </h2>
                <p className="mt-2 leading-relaxed text-slate-600">
                  La <strong>NOM-004-SSA3-2012</strong>, publicada en el Diario Oficial de la Federación,
                  establece los criterios científicos, éticos y administrativos obligatorios para la
                  elaboración, uso y conservación del expediente clínico en México. Aplica a{" "}
                  <strong>todos los establecimientos de atención médica de los sectores público, social y privado</strong>.
                  Su incumplimiento puede derivar en sanciones administrativas, multas e incluso la clausura del establecimiento.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <NormPoint text="Conservación mínima de 5 años" />
                  <NormPoint text="Obligatorio para todo personal de salud" />
                  <NormPoint text="Información confidencial del paciente" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official DOF Document */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            Publicado en el Diario Oficial de la Federación
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            No es opcional — es una norma oficial mexicana de observancia obligatoria
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-lg">
            {/* DOF Header */}
            <div className="border-b-2 border-green-800 bg-gradient-to-r from-green-900 to-green-800 px-6 py-3">
              <p className="text-xs font-bold tracking-wide text-white">
                NORMA Oficial Mexicana NOM-004-SSA3-2012, Del expediente clínico.
              </p>
            </div>
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-2">
              <p className="text-xs font-semibold text-green-900">
                Al margen un sello con el Escudo Nacional, que dice: Estados Unidos Mexicanos.- Secretaría de Salud.
              </p>
            </div>

            {/* DOF Content */}
            <div className="px-6 py-6 font-serif text-sm leading-relaxed text-slate-700">
              <p className="text-justify">
                GERMÁN ENRIQUE FAJARDO DOLCI, Subsecretario de Integración y Desarrollo del Sector Salud y
                Presidente del Comité Consultivo Nacional de Normalización de Innovación, Desarrollo, Tecnologías
                e Información en Salud, con fundamento en lo dispuesto por los artículos 39 de la Ley Orgánica de
                la Administración Pública Federal; 4o. de la Ley Federal de Procedimiento Administrativo...
              </p>

              <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-slate-900">
                CONSIDERANDO
              </p>

              <p className="mt-4 text-justify">
                Que con fecha 5 de octubre de 2010, fue publicado en el Diario Oficial de la Federación el
                Proyecto de Modificación de esta norma, en cumplimiento a la aprobación del mismo por parte del
                Comité Consultivo Nacional de Normalización de Innovación, Desarrollo, Tecnologías e Información en Salud...
              </p>

              <p className="mt-4 text-center text-xs font-bold uppercase tracking-widest text-slate-900">
                NORMA OFICIAL MEXICANA NOM-004-SSA3-2012, DEL EXPEDIENTE CLÍNICO
              </p>
              <p className="mt-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                PREFACIO
              </p>

              <p className="mt-4 text-xs text-slate-500">En la elaboración de esta norma participaron:</p>
              <div className="mt-2 columns-1 gap-8 text-xs text-slate-500 sm:columns-2">
                <p>CONSEJO DE SALUBRIDAD GENERAL</p>
                <p>SECRETARÍA DE SALUD</p>
                <p>Subsecretaría de Integración y Desarrollo del Sector Salud</p>
                <p>Subsecretaría de Prevención y Promoción de la Salud</p>
                <p>Dirección General de Calidad y Educación en Salud</p>
                <p>Dirección General de Epidemiología</p>
                <p>Dirección General de Información en Salud</p>
                <p>Instituto Nacional de Cancerología</p>
                <p>Instituto Nacional de Cardiología Ignacio Chávez</p>
                <p>Instituto Nacional de Pediatría</p>
                <p>Hospital General de México, O.D.</p>
                <p>Hospital Infantil de México Federico Gómez</p>
              </div>
            </div>

            {/* Fade overlay */}
            <div className="relative">
              <div className="absolute inset-x-0 -top-16 h-16 bg-gradient-to-t from-white to-transparent" />
              <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center">
                <a
                  href="https://dof.gob.mx/nota_detalle_popup.php?codigo=5272787"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                >
                  <span>Leer norma completa en el DOF</span>
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-slate-400">
            Fuente: Diario Oficial de la Federación — dof.gob.mx
          </p>
        </div>
      </section>

      {/* What NovaMed does */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Todo lo que la norma exige,
              <span className="text-blue-700"> en un solo sistema</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              NovaMed cubre cada requisito de la NOM-004 de forma digital, segura y accesible
              desde cualquier dispositivo.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="📋"
              title="Historia clínica completa"
              description="Ficha de identificación, antecedentes heredo-familiares y personales, padecimiento actual, exploración física y diagnóstico — exactamente como lo pide la NOM-004 (sección 6.1)."
            />
            <FeatureCard
              icon="📝"
              title="Notas de evolución"
              description="Registra la evolución del paciente con notas inmutables. Una vez firmadas no se pueden borrar, solo agregar adendas — cumpliendo las reglas de redacción de la norma."
            />
            <FeatureCard
              icon="💊"
              title="Recetas digitales"
              description="Genera recetas con cédula profesional, institución, domicilio, denominación genérica, dosis y vía de administración. Se envían al correo del paciente automáticamente."
            />
            <FeatureCard
              icon="🏥"
              title="Expediente quirúrgico"
              description="Notas preoperatorias (NOM-004, 8.5) y postoperatorias (8.8) con cada campo obligatorio. Hojas de consumo e insumos detallados por procedimiento."
            />
            <FeatureCard
              icon="🔒"
              title="Confidencialidad garantizada"
              description="Acceso por roles (doctor, enfermería, administrador), bitácora de auditoría de toda actividad, y datos que solo se revelan por orden judicial o autorización del paciente."
            />
            <FeatureCard
              icon="📦"
              title="Conservación de 5 años"
              description="Respaldos automáticos cifrados. Tu expediente clínico se conserva el mínimo de 5 años que exige la norma — sin que tengas que preocuparte por nada."
            />
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
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
              <div className="absolute -top-4 left-6 flex h-8 items-center gap-2 rounded-full bg-blue-700 px-3 text-xs font-bold text-white">
                Paso 1
              </div>
              <div className="mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                🏥
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Crea tu consultorio</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Regístrate gratis en menos de 2 minutos. Configura tu consultorio con tus datos, especialidades y cédula profesional.
              </p>
            </div>

            {/* Arrow connector (desktop only) */}

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
              <div className="absolute -top-4 left-6 flex h-8 items-center gap-2 rounded-full bg-teal-600 px-3 text-xs font-bold text-white">
                Paso 2
              </div>
              <div className="mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-3xl">
                👤
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Registra pacientes</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Captura la ficha de identificación, antecedentes y exploración física — la historia clínica completa que pide la NOM-004.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
              <div className="absolute -top-4 left-6 flex h-8 items-center gap-2 rounded-full bg-indigo-600 px-3 text-xs font-bold text-white">
                Paso 3
              </div>
              <div className="mb-4 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-3xl">
                📄
              </div>
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Consulta y receta</h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Escribe notas de evolución, genera recetas en PDF profesionales y envíalas automáticamente al correo del paciente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-slate-200 bg-slate-50 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            Planes simples, sin letras chiquitas
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            Empieza gratis y escala cuando tu consultorio lo necesite
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {/* Plan Gratuito */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Consultorio</h3>
                <p className="mt-1 text-sm text-slate-500">Para médicos independientes</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-slate-900">$0</span>
                  <span className="text-sm text-slate-500"> /mes</span>
                </div>
                <p className="mt-1 text-xs text-emerald-600 font-medium">Gratis para siempre</p>
              </div>
              <Link
                href="/registro"
                className="block w-full rounded-xl border border-blue-700 py-3 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                Comenzar gratis
              </Link>
              <ul className="mt-8 space-y-3">
                <PlanFeature included text="Historia clínica completa (NOM-004)" />
                <PlanFeature included text="Notas de evolución inmutables" />
                <PlanFeature included text="Recetas digitales en PDF" />
                <PlanFeature included text="Envío de receta por correo al paciente" />
                <PlanFeature included text="Gestión de pacientes" />
                <PlanFeature included text="1 usuario (doctor)" />
                <PlanFeature included={false} text="Expediente quirúrgico (pre y postoperatorio)" />
                <PlanFeature included={false} text="Hojas de consumo e insumos" />
                <PlanFeature included={false} text="Alertas automáticas por correo" />
                <PlanFeature included={false} text="Múltiples usuarios y roles" />
                <PlanFeature included={false} text="Panel administrativo" />
                <PlanFeature included={false} text="Bitácora de auditoría" />
              </ul>
            </div>

            {/* Plan Pro */}
            <div className="relative rounded-2xl border-2 border-blue-700 bg-white p-8 shadow-lg">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-700 px-4 py-1 text-xs font-semibold text-white">
                Más popular
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Clínica Pro</h3>
                <p className="mt-1 text-sm text-slate-500">Para clínicas y hospitales</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-slate-900">$4,500</span>
                  <span className="text-sm text-slate-500"> MXN/mes</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Factura incluida</p>
              </div>
              <Link
                href="/registro"
                className="block w-full rounded-xl bg-blue-700 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Solicitar demo
              </Link>
              <ul className="mt-8 space-y-3">
                <PlanFeature included text="Todo lo del plan Consultorio" />
                <PlanFeature included text="Expediente quirúrgico completo" />
                <PlanFeature included text="Notas preoperatorias (NOM-004, 8.5)" />
                <PlanFeature included text="Notas postoperatorias (NOM-004, 8.8)" />
                <PlanFeature included text="Hojas de consumo e insumos con precios" />
                <PlanFeature included text="Alertas automáticas por correo a paciente y doctor" />
                <PlanFeature included text="Usuarios ilimitados (doctores, enfermería, admin)" />
                <PlanFeature included text="Panel administrativo completo" />
                <PlanFeature included text="Bitácora de auditoría" />
                <PlanFeature included text="Respaldos cifrados automáticos" />
                <PlanFeature included text="Soporte prioritario" />
              </ul>
            </div>
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
            Cumple con la NOM-004 desde hoy. Miles de médicos en México ya necesitan
            digitalizar su expediente. Comienza gratis y sin compromiso.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/registro"
              className="w-full rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50 sm:w-auto"
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
            Sistema diseñado conforme a la NOM-004-SSA3-2012 para el expediente clínico,
            la Ley General de Salud y la LFPDPPP para protección de datos personales.
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

function PlanFeature({ included, text }: { included: boolean; text: string }) {
  return (
    <li className={`flex items-start gap-2.5 text-sm ${included ? "text-slate-700" : "text-slate-400"}`}>
      {included ? (
        <span className="mt-0.5 text-emerald-500">✓</span>
      ) : (
        <span className="mt-0.5 text-slate-300">✕</span>
      )}
      <span className={included ? "" : "line-through"}>{text}</span>
    </li>
  );
}

function NormPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
      <span className="text-amber-600">✓</span>
      <span>{text}</span>
    </div>
  );
}
