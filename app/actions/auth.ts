'use server'

import { redirect } from 'next/navigation'
import { validateAdminCredentials } from '@/app/lib/auth'
import { createSession, deleteSession } from '@/app/lib/session'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type LoginState = {
  error?: string
  fields?: {
    email?: string
  }
} | undefined

// ─────────────────────────────────────────────────────────────────────────────
// Login Action
// ─────────────────────────────────────────────────────────────────────────────

export async function loginAction(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = (formData.get('email') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null) ?? ''

  // Basic field presence check
  if (!email || !password) {
    return {
      error: 'Email and password are required.',
      fields: { email },
    }
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return {
      error: 'Please enter a valid email address.',
      fields: { email },
    }
  }

  // Validate against env-stored credentials
  const isValid = await validateAdminCredentials(email, password)

  if (!isValid) {
    // Intentionally vague to prevent user enumeration
    return {
      error: 'Invalid credentials. Please try again.',
      fields: { email },
    }
  }

  // Create JWT session cookie
  await createSession(email, 'admin')

  // Redirect must be called outside try/catch (it throws internally)
  redirect('/admin/dashboard')
}

// ─────────────────────────────────────────────────────────────────────────────
// Logout Action
// ─────────────────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  await deleteSession()
  redirect('/admin/login')
}
