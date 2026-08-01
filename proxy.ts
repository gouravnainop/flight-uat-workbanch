import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/app/lib/session'

// ─────────────────────────────────────────────────────────────────────────────
// Route definitions
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_LOGIN_PATH = '/admin/login'
const ADMIN_ROOT       = '/admin'
const UAT_ROOT         = '/uat'

// ─────────────────────────────────────────────────────────────────────────────
// Proxy (replaces deprecated middleware.ts in Next.js 16)
// ─────────────────────────────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Guard: /uat/* requires a valid client session ──────────────────────────
  if (pathname.startsWith(UAT_ROOT)) {
    const clientToken = request.cookies.get('fdcircle_client')?.value
    const clientSession = await decrypt(clientToken)

    if (!clientSession || clientSession.role !== 'client') {
      const homeUrl = new URL('/', request.nextUrl)
      homeUrl.searchParams.set('unauthorized', '1')
      return NextResponse.redirect(homeUrl)
    }

    return NextResponse.next()
  }

  // ── Guard: /admin/* requires a valid admin session ─────────────────────────
  if (!pathname.startsWith(ADMIN_ROOT)) {
    return NextResponse.next()
  }

  // The admin login page itself is always public
  if (pathname === ADMIN_LOGIN_PATH || pathname.startsWith(`${ADMIN_LOGIN_PATH}/`)) {
    const token = request.cookies.get('fdcircle_session')?.value
    const session = await decrypt(token)

    if (session?.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', request.nextUrl))
    }

    return NextResponse.next()
  }

  // All other /admin/* routes require a valid admin session
  const token = request.cookies.get('fdcircle_session')?.value
  const session = await decrypt(token)

  if (!session || session.role !== 'admin') {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.nextUrl)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Run proxy on all routes except Next.js internals and static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
