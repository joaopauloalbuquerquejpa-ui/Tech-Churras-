import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que exigem autenticação (qualquer role)
const PROTECTED_PREFIXES = [
  '/admin',
  '/boutiques/dashboard',
  '/boutiques/new',
  '/dashboard',
  '/favoritos',
  '/grillmasters/dashboard',
  '/grillmasters/new',
  '/grillmasters/orders',
  '/indicar',
  '/kit-perfeito',
  '/menu/assistente',
  '/orders',
  '/perfil',
]

// Exceções dentro de prefixos protegidos que devem continuar públicas —
// /orders/new é só um redirecionador pro wizard único /pedido (guest-friendly),
// não expõe dado de nenhum pedido existente. /menu/novo já não está na lista
// de prefixos acima (era standalone), então segue público sem exceção.
const PUBLIC_EXCEPTIONS = ['/orders/new']

// Dentro das protegidas, apenas ADMIN pode acessar
const ADMIN_PREFIXES = ['/admin']

// Páginas de auth — redireciona para o dashboard se já estiver logado
const AUTH_ONLY_ROUTES = ['/login', '/register', '/esqueci-senha', '/redefinir-senha']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = Boolean(request.cookies.get('tc-auth')?.value)
  const role = request.cookies.get('tc-role')?.value ?? ''

  // Usuário autenticado tentando acessar página de login/registro
  if (isAuthenticated && AUTH_ONLY_ROUTES.includes(pathname)) {
    const dest =
      role === 'GRILLMASTER' ? '/grillmasters/dashboard'
      : role === 'BOUTIQUE'  ? '/boutiques/dashboard'
      : role === 'ADMIN'     ? '/admin'
      : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Rota protegida sem auth → redireciona para login
  const isPublicException = PUBLIC_EXCEPTIONS.some(p => pathname === p || pathname.startsWith(p + '/'))
  const needsAuth = !isPublicException && PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  if (needsAuth && !isAuthenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Rota de admin com role errado → redireciona para dashboard
  const needsAdmin = ADMIN_PREFIXES.some(p => pathname.startsWith(p))
  if (needsAdmin && isAuthenticated && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Ignora assets estáticos, _next internals e favicon
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
