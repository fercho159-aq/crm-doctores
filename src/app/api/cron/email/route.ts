import { NextResponse } from "next/server";
import { procesarColaCorreo } from "@/lib/email";

// Invocado por cron del sistema (cada minuto) desde localhost:
// curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/email
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const resultado = await procesarColaCorreo();
  return NextResponse.json(resultado);
}
