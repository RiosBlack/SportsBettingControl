import NextAuth from "next-auth";
import { authEdgeConfig } from "./auth.edge.config";

// Usa configuração leve sem Prisma/bcrypt para o Edge Runtime
const { auth } = NextAuth(authEdgeConfig);

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
