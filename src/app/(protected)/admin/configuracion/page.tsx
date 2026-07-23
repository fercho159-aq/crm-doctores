import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { Card, CardHeader, CardBody } from "@/components/ui";
import { ConfigForm } from "./ConfigForm";

export default async function ConfiguracionPage() {
  await requireRole("ADMIN");
  const config = await db.configuracion.findUnique({ where: { id: 1 } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Configuración del establecimiento</h1>
      <Card>
        <CardHeader
          title="Datos de MIT"
          subtitle="Aparecen en el encabezado de recetas y formatos. El domicilio es obligatorio en la receta (RIS art. 28)."
        />
        <CardBody>
          <ConfigForm
            inicial={{
              razonSocial: config?.razonSocial ?? "",
              domicilio: config?.domicilio ?? "",
              telefono: config?.telefono ?? "",
              emailRemitente: config?.emailRemitente ?? "onboarding@resend.dev",
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
}
