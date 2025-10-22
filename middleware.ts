import { auth } from '@/auth'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
  const isOnAuth = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')

  // Se está tentando acessar dashboard sem estar logado, redireciona para login
  if (isOnDashboard && !isLoggedIn) {
    return Response.redirect(new URL('/login', nextUrl))
  }

  // Se está logado e tentando acessar login/register, redireciona para dashboard
  if (isLoggedIn && isOnAuth) {
    return Response.redirect(new URL('/dashboard', nextUrl))
  }

  return undefined
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}

