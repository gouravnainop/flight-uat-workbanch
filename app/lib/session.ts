import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SessionRole = 'admin' | 'client'

export type SessionPayload = {
  email?: string          // admin only
  role: SessionRole
  iat?: number
  exp?: number
}

export type ClientSessionPayload = SessionPayload & { role: 'client' }

// ─────────────────────────────────────────────────────────────────────────────
// Signing Key
// ─────────────────────────────────────────────────────────────────────────────

const SECRET = process.env.SESSION_SECRET
if (!SECRET) {
  throw new Error('SESSION_SECRET environment variable is not set.')
}
const ENCODED_KEY = new TextEncoder().encode(SECRET)
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// ─────────────────────────────────────────────────────────────────────────────
// Encrypt / Decrypt
// ─────────────────────────────────────────────────────────────────────────────

export async function encrypt(
  payload: Omit<SessionPayload, 'iat' | 'exp'>,
  expiresIn = '7d',
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(ENCODED_KEY)
}

export async function decrypt(token: string | undefined = ''): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, ENCODED_KEY, {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Lifecycle
// ─────────────────────────────────────────────────────────────────────────────

export async function createSession(email: string, role: 'admin'): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const token = await encrypt({ email, role })
  const cookieStore = await cookies()

  cookieStore.set('fdcircle_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('fdcircle_session')?.value
  return decrypt(token)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('fdcircle_session')
}

// ── Client Session (8-hour, for UAT explorer access) ──────────────────────────

const CLIENT_SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8 hours

export async function createClientSession(): Promise<void> {
  const expiresAt = new Date(Date.now() + CLIENT_SESSION_DURATION_MS)
  const token = await encrypt({ role: 'client' }, '8h')
  const cookieStore = await cookies()

  cookieStore.set('fdcircle_client', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function getClientSession(): Promise<ClientSessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('fdcircle_client')?.value
  const payload = await decrypt(token)
  if (!payload || payload.role !== 'client') return null
  return payload as ClientSessionPayload
}

export async function deleteClientSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('fdcircle_client')
}
