import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { enviarBienvenida } from "@/lib/email";

const SESSION_COOKIE = "mit_session";
const SESSION_HOURS = 8;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=google_denied", request.url));
  }

  // Verify state
  const jar = await cookies();
  const savedState = jar.get("google_oauth_state")?.value;
  jar.delete("google_oauth_state");

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
  }

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL("/login?error=token_exchange", request.url));
  }

  const tokens = await tokenRes.json();

  // Get user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userRes.ok) {
    return NextResponse.redirect(new URL("/login?error=userinfo", request.url));
  }

  const googleUser = await userRes.json() as {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };

  const email = googleUser.email.toLowerCase().trim();
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // Check if user already exists
  let usuario = await db.usuario.findUnique({
    where: { email },
    include: { doctor: true },
  });

  if (!usuario) {
    // Create new account: workspace + usuario + doctor (sin cédula, completará después)
    const result = await db.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: { tipo: "BASIC", nombre: `Consultorio — ${googleUser.name}` },
      });
      const user = await tx.usuario.create({
        data: {
          workspaceId: workspace.id,
          rol: "DOCTOR",
          email,
          passwordHash: "GOOGLE_OAUTH", // no password, login via Google
          nombreCompleto: googleUser.name,
          debeCambiarPassword: false,
        },
      });
      await tx.doctor.create({
        data: {
          usuarioId: user.id,
          cedulaProfesional: "",
          institucionTitulo: "",
        },
      });
      return { workspace, user };
    });

    usuario = await db.usuario.findUnique({
      where: { id: result.user.id },
      include: { doctor: true },
    });

    enviarBienvenida(email, googleUser.name).catch(() => {});

    await audit({
      usuarioId: result.user.id,
      rol: "DOCTOR",
      accion: "REGISTRO_GOOGLE",
      entidad: "workspace",
      entidadId: result.workspace.id,
      datosDespues: { email, nombreCompleto: googleUser.name },
      ipOrigen: ip,
    });
  }

  if (!usuario || !usuario.activo) {
    return NextResponse.redirect(new URL("/login?error=cuenta_inactiva", request.url));
  }

  // Create session
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000);

  await db.$transaction([
    db.session.create({ data: { id: sessionId, usuarioId: usuario.id, expiresAt } }),
    db.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() },
    }),
  ]);

  await audit({
    usuarioId: usuario.id,
    rol: usuario.rol,
    accion: "LOGIN_GOOGLE",
    entidad: "usuario",
    entidadId: usuario.id,
    ipOrigen: ip,
  });

  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return NextResponse.redirect(new URL("/mi-consulta", request.url));
}
