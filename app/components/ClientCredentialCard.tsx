'use client'

import { useActionState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { KeyRound, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { authorizeClientAction, type ClientAuthState } from '@/app/actions/client-auth'
import { Button, Input, Alert, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/app/components/ui'

// ── Component ──────────────────────────────────────────────────────────────────

export function ClientCredentialCard() {
  const [state, action, isPending] = useActionState<ClientAuthState, FormData>(
    authorizeClientAction,
    undefined,
  )

  // Show unauthorized message if redirected back from /uat
  const searchParams = useSearchParams()
  const wasUnauthorized = searchParams.get('unauthorized') === '1'

  // Store credentials in sessionStorage client-side after validation
  // (so the UAT explorer can use them for API calls and cURL generation)
  const router = useRouter()
  
  useEffect(() => {
    if (state && 'success' in state && state.success) {
      try {
        sessionStorage.setItem('fdcircle_api_key',    state.apiKey)
        sessionStorage.setItem('fdcircle_api_secret', state.apiSecret)
      } catch { /* ignore */ }
      
      router.push('/uat')
    }
  }, [state, router])

  const [showSecret, setShowSecret] = useToggle(false)

  return (
    <Card elevated className="w-full max-w-md text-left">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <KeyRound size={14} className="text-[--color-text-muted]" />
              Authorize
            </CardTitle>
            <CardDescription>
              UAT credentials only — live keys will not work here
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <div className="h-px bg-[--color-border-subtle] mx-5" />

      <CardContent className="pt-4 space-y-3">

        {/* Unauthorized redirect banner */}
        {wasUnauthorized && (
          <Alert variant="warning">
            <ShieldAlert size={14} />
            Session expired or invalid. Please re-authorize.
          </Alert>
        )}

        {/* Server validation error */}
        {state && 'error' in state && state.error && (
          <Alert variant="error">{state.error}</Alert>
        )}

        <form id="auth-form" action={action} className="space-y-3">
          <Input
            name="apiKey"
            label="API Key"
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder="fdc_uat_xxxxxxxxxxxxxxxx"
            required
            disabled={isPending}
            className="font-mono text-xs"
          />

          {/* Secret with show/hide */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="api-secret" className="text-xs font-medium text-[--color-text-secondary]">
              API Secret
            </label>
            <div className="relative">
              <input
                id="api-secret"
                name="apiSecret"
                type={showSecret ? 'text' : 'password'}
                autoComplete="off"
                placeholder="••••••••••••••••••••••••"
                required
                disabled={isPending}
                className="h-9 w-full rounded-[8px] border border-[--color-border-default] bg-[--color-surface-50] px-3 pr-9 text-xs font-mono text-[--color-text-primary] placeholder:text-[--color-text-muted] transition-colors focus:outline-none focus:border-[--color-brand-500] focus:ring-1 focus:ring-[--color-brand-500]/30 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowSecret((v: boolean) => !v)}
                aria-label={showSecret ? 'Hide secret' : 'Show secret'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
              >
                {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
          </div>

          <Button
            id="authorize-btn"
            type="submit"
            size="sm"
            fullWidth
            isLoading={isPending}
            loadingText="Validating…"
            className="mt-1"
          >
            <KeyRound size={12} />
            Authorize &amp; Explore
          </Button>
        </form>

        <p className="flex items-center gap-1.5 text-[10px] text-[--color-text-muted]">
          <KeyRound size={10} />
          Credentials validated server-side · tab-scoped memory only
        </p>
      </CardContent>
    </Card>
  )
}

// ── Local hook ─────────────────────────────────────────────────────────────────

function useToggle(initial: boolean): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const { useState } = require('react') as typeof import('react')
  return useState<boolean>(initial)
}
