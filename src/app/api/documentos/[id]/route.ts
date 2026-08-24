import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { audit } from "@/lib/audit";

// Descarga de documentos (PDFs) con control de acceso:
// Admin lectura global; Doctor solo pacientes con asignación activa suya.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const doc = await db.documento.findUnique({ where: { id }, include: { paciente: { select: { workspaceId: true } } } });
  if (!doc || doc.paciente.workspaceId !== user.workspaceId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (user.rol === "DOCTOR") {
    const asignacion = await db.asignacion.findFirst({
      where: { pacienteId: doc.pacienteId, doctorId: user.doctorId ?? "", estado: "ACTIVA" },
    });
    if (!asignacion) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  } else if (user.rol === "PACIENTE") {
    // Comparación directa contra su propio pacienteId de sesión, no contra el
    // workspace: un paciente jamás debe alcanzar el documento de otro paciente
    // del mismo workspace.
    if (doc.pacienteId !== user.pacienteId) return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  } else if (user.rol !== "ADMIN") {
    return NextResponse.json({ error: "Sin acceso" }, { status: 403 });
  }

  try {
    const contenido = await readFile(doc.ruta);
    await audit({
      usuarioId: user.id, rol: user.rol, accion: "DESCARGAR_DOCUMENTO",
      entidad: "documento", entidadId: doc.id, pacienteId: doc.pacienteId,
    });
    return new NextResponse(new Uint8Array(contenido), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${doc.nombreArchivo}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no disponible" }, { status: 500 });
  }
}
