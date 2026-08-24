import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { Stepper, StepperFooter, type Paso } from "@/components/Stepper";
import { cargarExpediente, nombreCompleto } from "./expediente";
import { edadDe } from "@/lib/pdf";
import { getSession } from "@/lib/auth";

export default async function ExpedienteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { paciente } = await cargarExpediente(id, { sinBitacora: true });
  const session = await getSession();
  const isBasic = session?.workspaceTipo === "BASIC";

  const [
    ultimaHoja,
    notasFirmadas,
    recetasEmitidas,
    qxRealizadas,
    qxTotal,
    docsTotal,
    ordenesFirmadas,
    prescripcionesFirmadas,
    hojasConsumo,
  ] = await Promise.all([
    db.hojaPrimerLlenado.findFirst({
      where: { pacienteId: id, estado: "CERRADA" },
      orderBy: { version: "desc" },
      select: { alergias: true },
    }),
    db.notaEvolucion.count({ where: { asignacion: { pacienteId: id }, estado: "FIRMADA" } }),
    db.receta.count({ where: { asignacion: { pacienteId: id }, estado: "EMITIDA" } }),
    db.expedienteQuirurgico.count({ where: { pacienteId: id, estado: "REALIZADA" } }),
    db.expedienteQuirurgico.count({ where: { pacienteId: id } }),
    db.documento.count({ where: { pacienteId: id } }),
    db.hojaOrdenes.count({ where: { pacienteId: id, estado: "FIRMADA" } }),
    db.hojaPrescripcion.count({ where: { pacienteId: id, estado: "FIRMADA" } }),
    db.hojaConsumo.count({ where: { pacienteId: id } }),
  ]);

  const activas = paciente.asignaciones.filter((a) => a.estado === "ACTIVA");
  const alergias = ultimaHoja?.alergias;
  const tieneAlergias = alergias && alergias.trim().toUpperCase() !== "NINGUNA CONOCIDA";

  // Flujo clínico por pasos (sustituye a las pestañas): el avance se marca con
  // el estado real del expediente.
  const pasos: Paso[] = isBasic
    ? [
        { href: `/pacientes/${id}`, label: "Paciente", completado: paciente.asignaciones.length > 0 },
        { href: `/pacientes/${id}/consulta-rapida`, label: "Consulta", completado: notasFirmadas > 0 },
        { href: `/pacientes/${id}/recetas`, label: "Recetas", completado: recetasEmitidas > 0 },
      ]
    : [
        { href: `/pacientes/${id}`, label: "Resumen", completado: paciente.asignaciones.length > 0 },
        { href: `/pacientes/${id}/historia`, label: "Historia clínica", completado: !!ultimaHoja },
        { href: `/pacientes/${id}/notas`, label: "Consulta y notas", completado: notasFirmadas > 0 },
        { href: `/pacientes/${id}/recetas`, label: "Receta", completado: recetasEmitidas > 0, opcional: true },
        { href: `/pacientes/${id}/prescripcion`, label: "Prescripción", completado: prescripcionesFirmadas > 0, opcional: true },
        { href: `/pacientes/${id}/ordenes`, label: "Órdenes médicas", completado: ordenesFirmadas > 0, opcional: true },
        { href: `/pacientes/${id}/cirugias`, label: "Cirugía", completado: qxTotal > 0 && qxRealizadas === qxTotal, opcional: true },
        { href: `/pacientes/${id}/consumo`, label: "Consumo", completado: hojasConsumo > 0, opcional: true },
        { href: `/pacientes/${id}/documentos`, label: "Documentos", completado: docsTotal > 0 },
      ];

  return (
    <div className="space-y-4">
      {/* Encabezado fijo del expediente: nombre, edad, sexo, expediente, alergias en rojo */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{nombreCompleto(paciente)}</h1>
            <p className="text-sm text-slate-500">
              {paciente.numeroExpediente} · {edadDe(paciente.fechaNacimiento)} ·{" "}
              {paciente.sexo === "M" ? "Masculino" : paciente.sexo === "F" ? "Femenino" : "Otro"}
              {paciente.tipoSangre ? ` · ${paciente.tipoSangre}` : ""}
              {paciente.email ? ` · ${paciente.email}` : " · SIN CORREO"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activas.map((a) => (
              <Badge key={a.id} tone="blue">{a.especialidad.nombre} — {a.doctor.usuario.nombreCompleto}</Badge>
            ))}
          </div>
        </div>
        <div
          className={`mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${
            tieneAlergias ? "bg-red-100 text-red-800" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          ALERGIAS: {alergias ?? "No registradas — revisar hoja de enfermería"}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <Stepper pasos={pasos} />
      </div>

      {children}

      <StepperFooter pasos={pasos} />
    </div>
  );
}
