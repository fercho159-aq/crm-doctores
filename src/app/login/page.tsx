import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-900 to-slate-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-700 text-2xl font-bold text-white">
            M
          </div>
          <h1 className="text-xl font-bold text-slate-900">MIT — Medical Tower</h1>
          <p className="mt-1 text-sm text-slate-500">Expediente Clínico Electrónico</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-slate-400">
          Acceso restringido al personal autorizado. Toda actividad queda registrada en bitácora.
        </p>
      </div>
    </main>
  );
}
