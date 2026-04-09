/**
 * Auth config mínimo para uso no middleware (Edge Runtime).
 * Não importa Prisma, bcrypt ou qualquer lib Node-only.
 * Apenas valida o JWT já existente no cookie.
 */
import NextAuth from 'next-auth'

export const { auth } = NextAuth({
  session: {
    strategy: 'jwt',
  },
  providers: [],
  callbacks: {
    async jwt({ token }) {
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  trustHost: true,
})
