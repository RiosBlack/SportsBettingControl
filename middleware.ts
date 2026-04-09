import { auth } from '@/auth.middleware'
import { NextResponse } from 'next/server'

export default auth((request) => {
  const { nextUrl, auth: session } = request
  const { pathname } = nextUrl

  const isLoggedIn = !!session

  // Rotas públicas que não requerem autenticação
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Se NÃO estiver logado
  if (!isLoggedIn) {
    // Redireciona raiz para login
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }

    // Redireciona rotas protegidas para login
    if (!isPublicRoute) {
      const loginUrl = new URL('/login', nextUrl)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // Se estiver logado e tentar acessar login/register/raiz, redireciona para dashboard
  if (pathname === '/login' || pathname === '/' || pathname === '/register') {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
