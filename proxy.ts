import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/app/lib/session'

// ─────────────────────────────────────────────────────────────────────────────
// Route definitions
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_LOGIN_PATH  = '/admin/login'
const ADMIN_ROOT        = '/admin'
const UAT_ROOT          = '/uat'
const INTEGRATE_ROOT    = '/integrate'

// ─────────────────────────────────────────────────────────────────────────────
// Proxy (Next.js request guard)
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

  // ── Guard: /integrate/* requires a valid admin session ─────────────────────
  if (pathname.startsWith(INTEGRATE_ROOT)) {
    const token = request.cookies.get('fdcircle_session')?.value
    const session = await decrypt(token)

    if (!session || session.role !== 'admin') {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.nextUrl)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // ── Guard: /admin/* ────────────────────────────────────────────────────────
  if (!pathname.startsWith(ADMIN_ROOT)) {
    return NextResponse.next()
  }

  // The admin login page is public (redirect if already logged in)
  const isLoginPage =
    pathname === ADMIN_LOGIN_PATH ||
    pathname.startsWith(`${ADMIN_LOGIN_PATH}/`)

  if (isLoginPage) {
    const token = request.cookies.get('fdcircle_session')?.value
    const session = await decrypt(token)

    if (session?.role === 'admin') {
      return NextResponse.redirect(new URL('/integrate', request.nextUrl))
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

