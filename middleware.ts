import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rotas de autenticação do NextAuth
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Lista de rotas públicas que não requerem autenticação
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  // Se não estiver autenticado
  if (!token) {
    // Se estiver tentando acessar a raiz, redireciona para login
    if (pathname === "/") {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Se não for rota pública, redireciona para login
    if (!isPublicRoute) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Se for rota pública, permite acesso
    return NextResponse.next();
  }

  // Se estiver autenticado e tentar acessar login ou raiz, redireciona para dashboard
  if (pathname === "/login" || pathname === "/" || pathname === "/register") {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Se estiver autenticado e acessar qualquer outra rota, permite o acesso
  return NextResponse.next();
}

// Configuração das rotas que serão protegidas pelo middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/",
    "/dashboard/:path*",
    "/api/:path*",
    "/login",
    "/register",
  ],
};
