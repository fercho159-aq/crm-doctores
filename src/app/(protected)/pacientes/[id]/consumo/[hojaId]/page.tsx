import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/authz";
import { Card, CardHeader, CardBody, Button } from "@/components/ui";
import { cargarExpediente } from "../../expediente";
import { RenglonesConsumo } from "./RenglonesConsumo";
import { generarConsumoPdf } from "@/actions/consumo";

const fecha = (d: Date | null) =>
  d ? d.toLocaleDateString("es-MX", { dateStyle: "medium", timeZone: "America/Mexico_City" }) : null;
const fechaISO = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export default async function HojaConsumoPage({ params }: { params: Promise<{ id: string; hojaId: string }> }) {
  const { id, hojaId } = await params;
  await cargarExpediente(id, { sinBitacora: true });
  const user = await requireUser();

  const hoja = await db.hojaConsumo.findUnique({
    where: { id: hojaId },
    include: {
      partidas: { orderBy: { orden: "asc" } },
      capturadoPor: { select: { nombreCompleto: true } },
    },
  });
  if (!hoja || hoja.pacienteId !== id) notFound();

  const insumos = await db.insumo.findMany({
    where: { activo: true },
    orderBy: [{ categoria: "asc" }, { orden: "asc" }],
    select: { id: true, nombre: true, categoria: true, precio: true },
  });

  const puedeCapturar = ["ENFERMERIA", "ADMIN", "DOCTOR"].includes(user.rol) && hoja.estado !== "CERRADA";
  const esAdmin = user.rol === "ADMIN";

  const datosCabecera: [string, string | null][] =
    hoja.tipo === "QUIROFANO"
      ? [
          ["Procedimiento", hoja.procedimiento],
          ["Cuarto", hoja.cuarto],
          ["Ingreso", fecha(hoja.fechaIngreso)],
          ["Egreso", fecha(hoja.fechaEgreso)],
          ["Ingreso a quirófano", hoja.horaIngresoQuirofano],
          ["Término de quirófano", hoja.horaTerminoQuirofano],
          ["Turno", hoja.turno],
          ["Cirujano", hoja.medicoCirujano],
          ["Anestesiólogo", hoja.medicoAnestesiologo],
          ["Enfermera", hoja.enfermera],
          ["Instrumentista", hoja.instrumentista],
        ]
      : [
          ["Tratamiento", hoja.tratamiento],
          ["Cuarto", hoja.cuarto],
        ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={hoja.tipo === "QUIROFANO" ? "Hoja de consumo en quirófano" : "Hoja de consumo de piso"}
          subtitle={`Capturó ${hoja.capturadoPor.nombreCompleto}${
            hoja.fechaCierre ? ` · cerrada el ${fecha(hoja.fechaCierre)}` : ""
          }`}
          action={
            <div className="flex gap-2">
              <Link href={`/pacientes/${id}/consumo`}>
                <Button variant="ghost" size="sm">
                  Volver
                </Button>
              </Link>
              <form action={generarConsumoPdf.bind(null, hoja.id) as unknown as (fd: FormData) => Promise<void>}>
                <Button type="submit" variant="secondary" size="sm">
                  Descargar PDF
                </Button>
              </form>
            </div>
          }
        />
        <CardBody>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            {datosCabecera
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase text-slate-500">{k}</dt>
                  <dd className="text-slate-800">{v}</dd>
                </div>
              ))}
          </dl>
        </CardBody>
      </Card>

      <RenglonesConsumo
        hojaId={hoja.id}
        tipo={hoja.tipo}
        cerrada={hoja.estado === "CERRADA"}
        puedeCapturar={puedeCapturar}
        puedeCerrar={esAdmin}
        puedeFijarPrecio={esAdmin}
        insumos={insumos.map((i) => ({
          id: i.id,
          nombre: i.nombre,
          categoria: i.categoria,
          precio: Number(i.precio),
        }))}
        partidas={hoja.partidas.map((p) => ({
          id: p.id,
          descripcion: p.descripcion,
          categoria: p.categoria,
          cantidad: Number(p.cantidad),
          precioUnitario: Number(p.precioUnitario),
          importe: Number(p.importe),
          fecha: fechaISO(p.fecha),
          enfermera: p.enfermera,
          observaciones: p.observaciones,
        }))}
      />
    </div>
  );
}
