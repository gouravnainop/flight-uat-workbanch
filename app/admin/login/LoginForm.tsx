'use client'

import { useActionState } from 'react'
import { LogIn } from 'lucide-react'
import { loginAction, type LoginState } from '@/app/actions/auth'
import { Button, Input, Alert } from '@/app/components/ui'

// ── Component ──────────────────────────────────────────────────────────────────

export default function LoginForm() {
  const [state, action, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined,
  )

  return (
    <form action={action} noValidate className="space-y-4">

      {/* Global error */}
      {state?.error && (
        <Alert variant="error">{state.error}</Alert>
      )}

      <Input
        name="email"
        type="email"
        label="Email address"
        autoComplete="email"
        spellCheck={false}
        required
        disabled={isPending}
        defaultValue={state?.fields?.email ?? ''}
        placeholder="admin@fdcircle.com"
        aria-describedby={state?.error ? 'login-error' : undefined}
      />

      <Input
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        disabled={isPending}
        placeholder="••••••••••••••••"
      />

      <Button
        id="login-submit"
        type="submit"
        fullWidth
        size="lg"
        isLoading={isPending}
        loadingText="Signing in…"
        className="mt-1"
      >
        <LogIn size={15} />
        Sign in
      </Button>
    </form>
  )
}
