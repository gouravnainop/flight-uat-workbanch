'use server'

import { redirect } from 'next/navigation'
import { createClientSession, deleteClientSession } from '@/app/lib/session'
import { timingSafeEqual, createHash } from 'crypto'

// ── Types ──────────────────────────────────────────────────────────────────────

export type ClientAuthState =
  | { error: string }
  | { success: true; apiKey: string; apiSecret: string }
  | undefined

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Constant-time string comparison using SHA-256 hashes to prevent
 * timing attacks, regardless of string length differences.
 */
function safeStringEqual(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a).digest()
  const hashB = createHash('sha256').update(b).digest()
  return timingSafeEqual(hashA, hashB)
}

// ── Authorize Action ───────────────────────────────────────────────────────────

export async function authorizeClientAction(
  _state: ClientAuthState,
  formData: FormData,
): Promise<ClientAuthState> {
  const apiKey    = (formData.get('apiKey')    as string | null)?.trim() ?? ''
  const apiSecret = (formData.get('apiSecret') as string | null)?.trim() ?? ''

  if (!apiKey || !apiSecret) {
    return { error: 'API Key and Secret are required.' }
  }

  const uatKey    = process.env.UAT_API_KEY    ?? ''
  const uatSecret = process.env.UAT_API_SECRET ?? ''

  if (!uatKey || !uatSecret) {
    console.error('[ClientAuth] UAT_API_KEY / UAT_API_SECRET env vars not set.')
    return { error: 'UAT credentials are not configured on the server. Contact admin.' }
  }

  const keyMatch    = safeStringEqual(apiKey, uatKey)
  const secretMatch = safeStringEqual(apiSecret, uatSecret)

  if (!keyMatch || !secretMatch) {
    // Intentionally vague — don't reveal whether key or secret was wrong
    return {
      error:
        'Invalid credentials. Only UAT API keys are accepted — live credentials will not work here.',
    }
  }

  // Valid UAT credentials — create session cookie
  await createClientSession()

  return { success: true, apiKey, apiSecret }
}

// ── Deauthorize Action ─────────────────────────────────────────────────────────

export async function deauthorizeClientAction(): Promise<void> {
  await deleteClientSession()
  redirect('/')
}
