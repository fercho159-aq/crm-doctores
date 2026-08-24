import { db } from "@/lib/db";
import { Card, CardHeader, CardBody, EmptyState } from "@/components/ui";
import { cargarPacientePropio } from "../paciente";

// Vista curada del SOAP (§8 del plan): se muestra diagnóstico, plan/indicaciones
// y pronóstico — lo accionable para el paciente. Se oculta deliberadamente el
// texto técnico de exploración física (objetivo), resultados de estudios en
// crudo y signos vitales tal cual los captura el médico, que requieren
// contexto clínico para interpretarse correctamente. Política fija de esta
// fase: la nota, una vez FIRMADA, es inmutable a nivel de base de datos, así
// que no hay una bandera de visibilidad por nota que editar después.
export default async function ConsultasPortal() {
  const { paciente } = await cargarPacientePropio({ sinBitacora: true });

  const notas = await db.notaEvolucion.findMany({
    where: { asignacion: { pacienteId: paciente.id }, estado: "FIRMADA", notaPadreId: null },
    include: {
      asignacion: { include: { especialidad: true, doctor: { include: { usuario: true } } } },
      elaboradaPor: true,
    },
    orderBy: { fechaHora: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Consultas</h1>
      {notas.length === 0 ? (
        <EmptyState title="Aún no tiene consultas registradas." />
      ) : (
        notas.map((n) => (
          <Card key={n.id}>
            <CardHeader
              title={`${n.asignacion.especialidad.nombre} — ${n.elaboradaPor.nombreCompleto}`}
              subtitle={n.fechaHora.toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
            />
            <CardBody className="space-y-2 text-sm text-slate-700">
              {n.diagnosticos && <p><strong>Diagnóstico:</strong> {n.diagnosticos}</p>}
              {n.planTratamiento && <p><strong>Indicaciones:</strong> {n.planTratamiento}</p>}
              {n.pronostico && <p><strong>Pronóstico:</strong> {n.pronostico}</p>}
              {!n.diagnosticos && !n.planTratamiento && !n.pronostico && (
                <p className="text-slate-400">Sin detalle adicional disponible para esta consulta.</p>
              )}
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
