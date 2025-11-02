import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authEdgeConfig } from "./auth.edge.config";

// Usa configuração leve sem Prisma/bcrypt para o Edge Runtime
const { auth } = NextAuth(authEdgeConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isOnAuth =
    nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/register");

  // Redireciona para dashboard se já estiver logado e tentar acessar login/register
  if (isLoggedIn && isOnAuth) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
