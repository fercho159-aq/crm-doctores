import { ActivarForm } from "./ActivarForm";

export default async function ActivarPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-900 to-slate-900 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-2xl font-bold text-white">
            +
          </div>
          <h1 className="text-xl font-bold text-slate-900">Active su portal de paciente</h1>
          <p className="mt-1 text-sm text-slate-500">Defina una contraseña para acceder a su expediente en línea.</p>
        </div>
        <ActivarForm token={token} />
      </div>
    </main>
  );
}
