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

      // Redireciona para login se tentar acessar dashboard sem estar logado
      if (isOnDashboard && !isLoggedIn) {
        return false;
      }

      return true;
    },
  },
  providers: [], // Vazio no edge - providers são usados apenas nas rotas API
} satisfies NextAuthConfig;
