import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { randomBytes } from "crypto";
import { hash, verify } from "@node-rs/argon2";
import { db } from "./db";
import { audit } from "./audit";
import type { RolClave, TipoWorkspace } from "@prisma/client";

const SESSION_COOKIE = "mit_session";
const SESSION_HOURS = 8;
const MAX_INTENTOS = 5;
const BLOQUEO_MIN = 15;

export const ARGON2_OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

export type SessionUser = {
  id: string;
  email: string;
  nombreCompleto: string;
  rol: RolClave;
  debeCambiarPassword: boolean;
  doctorId: string | null;
  workspaceId: string;
  workspaceTipo: TipoWorkspace;
};

export async function hashPassword(password: string) {
  return hash(password, ARGON2_OPTS);
}

export async function getClientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await getClientIp();
  const usuario = await db.usuario.findUnique({ where: { email: email.toLowerCase().trim() }, include: { doctor: true } });

  const generico = { ok: false as const, error: "Correo o contraseña incorrectos." };

  if (!usuario || !usuario.activo) {
    await audit({ accion: "LOGIN_FALLIDO", entidad: "usuario", entidadId: email, ipOrigen: ip });
    return generico;
  }
  if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
    return { ok: false, error: "Cuenta bloqueada temporalmente por intentos fallidos. Intente más tarde." };
  }

  const valid = await verify(usuario.passwordHash, password);
  if (!valid) {
    const intentos = usuario.intentosFallidos + 1;
    await db.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: intentos,
        bloqueadoHasta: intentos >= MAX_INTENTOS ? new Date(Date.now() + BLOQUEO_MIN * 60_000) : null,
      },
    });
    await audit({ usuarioId: usuario.id, rol: usuario.rol, accion: "LOGIN_FALLIDO", entidad: "usuario", entidadId: usuario.id, ipOrigen: ip });
    return generico;
  }

  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 3600_000);
  await db.$transaction([
    db.session.create({ data: { id: sessionId, usuarioId: usuario.id, expiresAt } }),
    db.usuario.update({ where: { id: usuario.id }, data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() } }),
  ]);
  await audit({ usuarioId: usuario.id, rol: usuario.rol, accion: "LOGIN", entidad: "usuario", entidadId: usuario.id, ipOrigen: ip });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return { ok: true };
}

export async function logout() {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (sid) {
    await db.session.deleteMany({ where: { id: sid } });
    jar.delete(SESSION_COOKIE);
  }
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  const session = await db.session.findUnique({
    where: { id: sid },
    include: { usuario: { include: { doctor: true, workspace: true } } },
  });
  if (!session || session.expiresAt < new Date() || !session.usuario.activo) return null;

  // renovación por actividad: extiende si queda menos de la mitad
  if (session.expiresAt.getTime() - Date.now() < (SESSION_HOURS / 2) * 3600_000) {
    await db.session.update({
      where: { id: sid },
      data: { expiresAt: new Date(Date.now() + SESSION_HOURS * 3600_000) },
    }).catch(() => {});
  }

  const u = session.usuario;
  return {
    id: u.id,
    email: u.email,
    nombreCompleto: u.nombreCompleto,
    rol: u.rol,
    debeCambiarPassword: u.debeCambiarPassword,
    doctorId: u.doctor?.id ?? null,
    workspaceId: u.workspaceId,
    workspaceTipo: u.workspace.tipo,
  };
});

export async function revokeSessions(usuarioId: string) {
  await db.session.deleteMany({ where: { usuarioId } });
}
