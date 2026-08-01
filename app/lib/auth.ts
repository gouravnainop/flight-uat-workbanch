import 'server-only'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type AdminUser = {
  email: string
  password: string // bcrypt hash
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse admin users from environment variable
// ─────────────────────────────────────────────────────────────────────────────

function getAdminUsers(): AdminUser[] {
  const raw = process.env.ADMIN_CREDENTIALS
  if (!raw) {
    console.warn('[Auth] ADMIN_CREDENTIALS env var is not set. No admins will be able to log in.')
    return []
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) throw new Error('ADMIN_CREDENTIALS must be a JSON array.')
    return parsed as AdminUser[]
  } catch (err) {
    console.error('[Auth] Failed to parse ADMIN_CREDENTIALS:', err)
    return []
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Validate admin credentials
// Uses a constant-time string comparison for the bcrypt hash.
// We dynamically import bcryptjs to keep it out of the Edge bundle if needed.
// ─────────────────────────────────────────────────────────────────────────────

export async function validateAdminCredentials(
  email: string,
  password: string,
): Promise<boolean> {
  const admins = getAdminUsers()
  const admin = admins.find(
    (a) => a.email.toLowerCase() === email.toLowerCase().trim(),
  )

  if (!admin) return false

  // Lazy-import bcryptjs — pure JS, no native bindings, works in Node.js runtime
  const bcrypt = await import('bcryptjs')
  const isValid = await bcrypt.compare(password, admin.password)
  return isValid
}
