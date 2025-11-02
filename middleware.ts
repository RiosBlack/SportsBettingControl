import NextAuth from "next-auth";
import { authEdgeConfig } from "./auth.edge.config";

// Usa configuração leve sem Prisma/bcrypt para o Edge Runtime
export default NextAuth(authEdgeConfig).auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
