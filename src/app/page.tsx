import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-blue-700">
            M
          </div>
          <span className="text-lg font-semibold text-white">CRM Doctores</span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/registro"
            className="rounded-lg px-4 py-2 text-sm font-medium text-blue-200 transition hover:text-white"
          >
            Registrarse
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
          El expediente clínico electrónico
          <span className="block text-blue-300">que tu consultorio necesita</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-blue-100/80">
          Diseñado para médicos y clínicas en México. Lleva el control de tus
          pacientes, genera recetas, y cumple con el expediente digital que
          exigen las autoridades de salud — todo desde un solo lugar.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/registro"
            className="rounded-xl bg-white px-8 py-3 text-base font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50"
          >
            Crear mi consultorio gratis
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-white/30 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="📋"
            title="Expediente digital"
            description="Historia clínica, notas de evolución y documentos organizados por paciente. Cumple con la NOM-004-SSA3."
          />
          <FeatureCard
            icon="💊"
            title="Recetas electrónicas"
            description="Genera y envía recetas profesionales directamente al correo de tus pacientes con un solo click."
          />
          <FeatureCard
            icon="👥"
            title="Gestión de pacientes"
            description="Directorio completo de pacientes con su historial, cirugías, estudios y seguimiento centralizado."
          />
          <FeatureCard
            icon="🏥"
            title="Hojas de consumo"
            description="Registra insumos y materiales utilizados en cada procedimiento quirúrgico de forma detallada."
          />
          <FeatureCard
            icon="📊"
            title="Panel administrativo"
            description="Visualiza la actividad de tu clínica, administra usuarios, doctores y configuración general."
          />
          <FeatureCard
            icon="🔒"
            title="Seguro y privado"
            description="Acceso por roles, bitácora de actividad y datos protegidos. Solo personal autorizado accede a la información."
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-blue-200/60">
        <p>CRM Doctores — Hecho en México por MAW Soluciones</p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
      <div className="mb-3 text-3xl">{icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-blue-100/70">{description}</p>
    </div>
  );
}
