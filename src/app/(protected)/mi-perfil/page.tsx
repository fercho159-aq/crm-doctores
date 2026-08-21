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
    </div>
  );
}
