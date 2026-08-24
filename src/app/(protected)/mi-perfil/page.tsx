import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody } from "@/components/ui";
import { PerfilDoctorForm, FirmaPropiaForm } from "./Forms";

export default async function MiPerfilPage() {
  const user = await requireRole("DOCTOR");
  const doctor = await db.doctor.findUniqueOrThrow({ where: { id: user.doctorId! } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
      <p className="text-sm text-slate-500">
        Estos datos aparecen en sus recetas y documentos. Manténgalos actualizados.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Datos profesionales" />
          <CardBody>
            <PerfilDoctorForm doctor={doctor} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Firma digitalizada" subtitle="Se imprime en cada receta y nota firmada." />
          <CardBody>
            <FirmaPropiaForm firmaActual={doctor.firmaDigitalizada} />
          </CardBody>
        </Card>
      </div>

      {/* Secciones bloqueadas — Plan Consultorio ($199) */}
      {user.workspaceTipo === "BASIC" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-400">Personalización — Plan Consultorio ($199/mes)</h2>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="relative rounded-2xl border border-slate-200 bg-white p-6 opacity-50">
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px]">
                <a href="/precios" className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-800">
                  Cambiar al plan Consultorio →
                </a>
              </div>
              <h3 className="text-base font-semibold text-slate-900">Logo del consultorio</h3>
              <p className="mt-1 text-sm text-slate-500">Aparece en tus recetas, reportes y portal del paciente.</p>
              <div className="mt-4 flex h-24 w-24 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-3xl text-slate-300">
                +
              </div>
            </div>

            <div className="relative rounded-2xl border border-slate-200 bg-white p-6 opacity-50">
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px]">
                <a href="/precios" className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-800">
                  Cambiar al plan Consultorio →
                </a>
              </div>
              <h3 className="text-base font-semibold text-slate-900">Colores de marca</h3>
              <p className="mt-1 text-sm text-slate-500">Personaliza la apariencia de tu consultorio digital.</p>
              <div className="mt-4 flex gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-700" />
                <div className="h-10 w-10 rounded-full bg-slate-200" />
                <div className="h-10 w-10 rounded-full bg-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
