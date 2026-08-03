import { Suspense } from 'react'
import { ArrowLeft, CodeXml } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Admin Access — FDCircle UAT',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[--color-surface-0] px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-[--color-surface-200] border border-[--color-border-default] flex items-center justify-center">
            <CodeXml size={16} className="text-[--color-brand-400]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[--color-text-primary]">
              Admin Portal
            </h1>
            <p className="text-xs text-[--color-text-muted] mt-0.5">
              Workbench Access &amp; Management · Internal use only
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-[--color-border-default] bg-[--color-surface-100] p-5 shadow-sm">
          <Suspense fallback={<div className="h-48 flex items-center justify-center"><div className="w-5 h-5 rounded-full border-2 border-t-[--color-brand-500] border-[--color-surface-300] animate-spin" /></div>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
          >
            <ArrowLeft size={12} />
            Back to Portal
          </Link>
        </div>

      </div>
    </div>
  )
}


