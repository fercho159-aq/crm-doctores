import { NextResponse, type NextRequest } from "next/server";

// Filtro grueso: solo verifica presencia de cookie de sesión.
// La autorización real (rol + propiedad) vive en lib/authz.ts en cada Server Action/página.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/login" || pathname.startsWith("/api/cron");
  const hasSession = request.cookies.has("mit_session");

  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
