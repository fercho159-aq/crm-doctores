import Link from "next/link";

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

      {/* Testimonials */}
      <section className="border-t border-slate-200 bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Lo que dicen los doctores
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-slate-500">
            Médicos que ya digitalizaron su consultorio con NovaMed
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Testimonial
              stars={5}
              text="Llevaba años con expedientes en papel y siempre tenía miedo de una inspección. Con NovaMed en dos días ya tenía todo digitalizado. Muy intuitivo."
              name="Dr. Alejandro Ruiz M."
              specialty="Traumatología y Ortopedia"
              location="CDMX"
            />
            <Testimonial
              stars={5}
              text="Las recetas se envían solas al correo del paciente. Mis pacientes me dicen que se ve muy profesional. Ya no imprimo nada."
              name="Dra. Mariana López G."
              specialty="Medicina Interna"
              location="Monterrey, NL"
            />
            <Testimonial
              stars={5}
              text="Lo que más me gustó es que las notas no se pueden borrar, solo agregar adendas. Eso me da tranquilidad legal. Cumple con todo lo de la NOM-004."
              name="Dr. Roberto Sánchez P."
              specialty="Cirugía General"
              location="Guadalajara, JAL"
            />
            <Testimonial
              stars={4}
              text="Tengo un consultorio pequeño y pensé que era solo para clínicas grandes. Pero el plan gratuito me alcanza perfecto. Muy recomendable."
              name="Dra. Fernanda Torres D."
              specialty="Ginecología y Obstetricia"
              location="Puebla, PUE"
            />
            <Testimonial
              stars={5}
              text="La hoja de consumo quirúrgico es exactamente lo que necesitaba. Registro cada insumo y el administrador tiene todo claro para cobrar."
              name="Dr. Carlos Mendoza R."
              specialty="Neurología"
              location="Querétaro, QRO"
            />
            <Testimonial
              stars={5}
              text="Nos llegó una verificación sanitaria y pudimos mostrar todo el expediente digital al momento. El verificador quedó satisfecho. Valió cada peso."
              name="Dr. Héctor Vega L."
              specialty="Cardiología"
              location="Mérida, YUC"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-200 bg-white px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Así de fácil funciona
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <Step
              number="1"
              title="Crea tu consultorio"
              description="Regístrate gratis, configura tu consultorio con tus datos fiscales y especialidades."
            />
            <Step
              number="2"
              title="Registra pacientes"
              description="Enfermería o tú mismo capturan la hoja de ingreso con la historia clínica del paciente."
            />
            <Step
              number="3"
              title="Consulta y receta"
              description="Atiende, escribe notas de evolución, genera recetas PDF y envíalas por correo al paciente."
            />
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

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
        {number}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

function Testimonial({ stars, text, name, specialty, location }: { stars: number; text: string; name: string; specialty: string; location: string }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div className="mb-3 flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < stars ? "text-amber-400" : "text-slate-300"}>★</span>
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-slate-600">&ldquo;{text}&rdquo;</p>
      <div className="mt-4 border-t border-slate-200 pt-4">
        <p className="text-sm font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{specialty}</p>
        <p className="text-xs text-slate-400">{location}</p>
      </div>
    </div>
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
