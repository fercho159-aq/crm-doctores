import { requireRole } from "@/lib/authz";
import { db } from "@/lib/db";
import { toggleUsuario } from "@/actions/admin";
import { Card, CardHeader, CardBody, Badge, Button } from "@/components/ui";
import { NuevaEnfermeriaForm, NuevaAnestesiologoForm, ResetPasswordForm } from "./Forms";

const ROL: Record<string, string> = {
  ADMIN: "Administrador",
  DOCTOR: "Doctor(a)",
  ENFERMERIA: "Enfermería",
  ANESTESIOLOGO: "Anestesiólogo(a)",
};

export default async function UsuariosPage() {
  const admin = await requireRole("ADMIN");
  const usuarios = await db.usuario.findMany({ orderBy: [{ rol: "asc" }, { nombreCompleto: "asc" }] });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Todos los usuarios" subtitle="Nunca se borran: se desactivan (baja lógica) y se revocan sus sesiones." />
          <CardBody>
            <div className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <div key={u.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">
                        {u.nombreCompleto} <Badge tone="blue">{ROL[u.rol]}</Badge>{" "}
                        {!u.activo && <Badge tone="red">Inactivo</Badge>}
                        {u.debeCambiarPassword && u.activo && <Badge tone="amber">Contraseña temporal</Badge>}
                      </p>
                      <p className="text-sm text-slate-500">
                        {u.email}
                        {u.ultimoAcceso ? ` · último acceso ${u.ultimoAcceso.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}` : " · nunca ha entrado"}
                      </p>
                    </div>
                    {u.id !== admin.id && (
                      <form action={toggleUsuario.bind(null, u.id)}>
                        <Button size="sm" variant={u.activo ? "danger" : "secondary"}>
                          {u.activo ? "Desactivar" : "Activar"}
                        </Button>
                      </form>
                    )}
                  </div>
                  <ResetPasswordForm usuarioId={u.id} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Alta de enfermería" />
            <CardBody>
              <NuevaEnfermeriaForm />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Alta de anestesiología" />
            <CardBody>
              <NuevaAnestesiologoForm />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
