import Link from "next/link";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui";
import { cargarExpediente, nombreCompleto } from "./expediente";
import { edadDe } from "@/lib/pdf";

export default async function ExpedienteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { paciente } = await cargarExpediente(id, { sinBitacora: true });

  const ultimaHoja = await db.hojaPrimerLlenado.findFirst({
    where: { pacienteId: id, estado: "CERRADA" },
    orderBy: { version: "desc" },
    select: { alergias: true },
  });

  const activas = paciente.asignaciones.filter((a) => a.estado === "ACTIVA");
  const alergias = ultimaHoja?.alergias;
  const tieneAlergias = alergias && alergias.trim().toUpperCase() !== "NINGUNA CONOCIDA";

  const tabs = [
    { href: `/pacientes/${id}`, label: "Resumen" },
    { href: `/pacientes/${id}/historia`, label: "Historia clínica" },
    { href: `/pacientes/${id}/notas`, label: "Notas" },
    { href: `/pacientes/${id}/recetas`, label: "Recetas" },
    { href: `/pacientes/${id}/cirugias`, label: "Cirugías" },
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

      <nav className="flex flex-wrap gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-t-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-800"
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
