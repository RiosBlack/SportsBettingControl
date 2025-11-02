import type { NextAuthConfig } from "next-auth";

// Configuração leve para o Edge Runtime (middleware)
// Não importa Prisma nem bcryptjs para manter o bundle pequeno
export const authEdgeConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAuth =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      // Redireciona para login se tentar acessar dashboard sem estar logado
      if (isOnDashboard && !isLoggedIn) {
        return false;
      }

      // Redireciona para dashboard se já estiver logado e tentar acessar login/register
      if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [], // Vazio no edge - providers são usados apenas nas rotas API
} satisfies NextAuthConfig;
