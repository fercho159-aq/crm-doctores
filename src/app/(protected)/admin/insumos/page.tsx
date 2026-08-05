import { db } from "@/lib/db";
import { requireRole } from "@/lib/authz";
import { Card, CardHeader, CardBody, EmptyState } from "@/components/ui";
import { CATEGORIA_INSUMO_LABEL } from "@/lib/catalogoInsumos";
import { PrecioForm } from "./PrecioForm";
import type { CategoriaInsumo } from "@prisma/client";

// Catálogo que alimenta las hojas de consumo. El precio lo fija administración
// y es el que se copia al renglón cuando enfermería registra una pieza.
export default async function InsumosPage() {
  await requireRole("ADMIN");

  const insumos = await db.insumo.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { orden: "asc" }],
  });

  const categorias = Object.keys(CATEGORIA_INSUMO_LABEL) as CategoriaInsumo[];
  const sinPrecio = insumos.filter((i) => Number(i.precio) === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Insumos y precios</h1>
        <p className="mt-1 text-sm text-slate-500">
          {insumos.length} renglones del catálogo.{" "}
          {sinPrecio > 0 && (
            <span className="font-medium text-amber-700">{sinPrecio} sin precio capturado.</span>
          )}
        </p>
      </div>

      {insumos.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState title="El catálogo está vacío. Ejecute el seed para cargar los insumos de la hoja de consumo." />
          </CardBody>
        </Card>
      ) : (
        categorias.map((cat) => {
          const grupo = insumos.filter((i) => i.categoria === cat);
          if (grupo.length === 0) return null;
          return (
            <Card key={cat}>
              <CardHeader title={CATEGORIA_INSUMO_LABEL[cat]} subtitle={`${grupo.length} renglones`} />
              <CardBody>
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    {grupo.map((i) => (
                      <tr key={i.id}>
                        <td className="py-1.5 pr-4 text-slate-800">{i.nombre}</td>
                        <td className="w-64 py-1.5">
                          <PrecioForm insumoId={i.id} precio={Number(i.precio)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          );
        })
      )}
    </div>
  );
}
