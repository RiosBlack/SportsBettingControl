import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Atualizar sessão do Supabase e obter usuário
  const { supabaseResponse, user } = await updateSession(request)

  // Rotas públicas que não requerem autenticação
  const publicRoutes = ['/login', '/register']
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Se não estiver logado
  if (!user) {
    // Se tentar acessar a raiz, redireciona para login
    if (pathname === '/') {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return Response.redirect(loginUrl)
    }

    // Se não for rota pública, redireciona para login
    if (!isPublicRoute) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('callbackUrl', pathname)
      return Response.redirect(loginUrl)
    }

    // Se for rota pública, permite acesso
    return supabaseResponse
  }

  // Se estiver logado e tentar acessar login/register ou raiz, redireciona para dashboard
  if (pathname === '/login' || pathname === '/' || pathname === '/register') {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    return Response.redirect(dashboardUrl)
  }

  // Se estiver logado e acessar qualquer outra rota, permite o acesso
  return supabaseResponse
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
