import { auth } from '@/auth'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Obter sessão do NextAuth
  const session = await auth()

  // Rotas públicas que não requerem autenticação
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Se não estiver logado
  if (!session?.user) {
    // Se tentar acessar a raiz, redireciona para login
    if (pathname === '/') {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }

    // Se não for rota pública, redireciona para login
    if (!isPublicRoute) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Se for rota pública, permite acesso
    return NextResponse.next()
  }

  // Se estiver logado e tentar acessar login/register ou raiz, redireciona para dashboard
  if (pathname === '/login' || pathname === '/' || pathname === '/register') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return NextResponse.redirect(dashboardUrl)
  }

  // Se estiver logado e acessar qualquer outra rota, permite o acesso
  return NextResponse.next()
}

// Configuração das rotas que serão protegidas pelo middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (arquivos em /public)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
