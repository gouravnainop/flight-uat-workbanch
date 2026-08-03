'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import { LogIn, ShieldCheck } from 'lucide-react'
import { loginAction, type LoginState } from '@/app/actions/auth'
import { Button, Input, Alert } from '@/app/components/ui'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const from = searchParams.get('from') ?? ''
  const isFromIntegrate = from.startsWith('/integrate')

  const [state, action, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined,
  )

  return (
    <form action={action} noValidate className="space-y-4">
      {/* Notice if redirected from protected route */}
      {isFromIntegrate && (
        <Alert variant="info">
          <ShieldCheck size={14} />
          Admin authorization required to access the Integration Workbench.
        </Alert>
      )}

      {/* Global error */}
      {state?.error && (
        <Alert variant="error">{state.error}</Alert>
      )}

      {/* Destination hidden field */}
      {from && <input type="hidden" name="from" value={from} />}

      <Input
        name="email"
        type="email"
        label="Admin Email"
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
        size="md"
        isLoading={isPending}
        loadingText="Signing in…"
        className="mt-1"
      >
        <LogIn size={15} />
        Sign in to Workbench
      </Button>
    </form>
  )
}

