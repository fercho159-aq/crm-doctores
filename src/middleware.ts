import { NextResponse, type NextRequest } from "next/server";

// Filtro grueso: solo verifica presencia de cookie de sesión.
// La autorización real (rol + propiedad) vive en lib/authz.ts en cada Server Action/página.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/login" || pathname === "/registro" || pathname.startsWith("/api/cron");
  const hasSession = request.cookies.has("mit_session");

  // Nunca se redirige /login → / solo por existir la cookie: si la sesión es
  // inválida provocaría un bucle de redirecciones. El login siempre se muestra.
  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
