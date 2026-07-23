import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CambiarPasswordForm } from "./CambiarPasswordForm";

export default async function CambiarPasswordPage() {
  const user = await getSession();
  if (!user) redirect("/login");
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-lg font-bold text-slate-900">Cambio de contraseña</h1>
        <p className="mb-5 mt-1 text-sm text-slate-500">
          {user.debeCambiarPassword
            ? "Por seguridad, debe establecer una contraseña nueva antes de continuar."
            : "Establezca su nueva contraseña."}
        </p>
        <CambiarPasswordForm />
      </div>
    </main>
  );
}
