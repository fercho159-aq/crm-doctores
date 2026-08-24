"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { login, logout, getSession, hashPassword, revokeSessions } from "@/lib/auth";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export type ActionState = { error?: string; ok?: boolean };

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const result = await login(parsed.data.email, parsed.data.password);
  if (!result.ok) return { error: result.error };
  if (parsed.data.email.toLowerCase().trim() === "info@novamedics.com.mx") {
    redirect("/superadmin");
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

const cambioSchema = z.object({
  passwordActual: z.string().min(1, "Requerida"),
  passwordNueva: z
    .string()
    .min(10, "Mínimo 10 caracteres")
    .regex(/[A-Z]/, "Debe incluir mayúscula")
    .regex(/[a-z]/, "Debe incluir minúscula")
    .regex(/[0-9]/, "Debe incluir número"),
  passwordConfirma: z.string(),
});

export async function cambiarPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getSession();
  if (!user) redirect("/login");
  const parsed = cambioSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data.passwordNueva !== parsed.data.passwordConfirma) {
    return { error: "Las contraseñas no coinciden" };
  }
  const { verify } = await import("@node-rs/argon2");
  const dbUser = await db.usuario.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verify(dbUser.passwordHash, parsed.data.passwordActual))) {
    return { error: "La contraseña actual es incorrecta" };
  }
  await db.usuario.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.passwordNueva), debeCambiarPassword: false },
  });
  await revokeSessions(user.id);
  await audit({ usuarioId: user.id, rol: user.rol, accion: "CAMBIO_PASSWORD", entidad: "usuario", entidadId: user.id });
  redirect("/login");
}
