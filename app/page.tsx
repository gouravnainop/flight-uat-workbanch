import { ClientCredentialCard } from '@/app/components/ClientCredentialCard'
import { Badge } from '@/app/components/ui'
import { getSession } from '@/app/lib/session'
import {
  BookOpen,
  CircleDot,
  Code2,
  CodeXml,
  Globe2,
  PlaneTakeoffIcon,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import Link from 'next/link'

// ── Feature list ───────────────────────────────────────────────────────────────

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}

const features: Feature[] = [
  { icon: PlaneTakeoffIcon, label: 'UAT Sectors' },
  { icon: Code2,            label: 'TypeScript Models' },
  { icon: BookOpen,         label: 'API Reference' },
  { icon: Globe2,           label: 'No Real World Affects' },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const session = await getSession()
  const isAdmin = session?.role === 'admin'

  return (
    <div className="flex flex-col min-h-dvh bg-[--color-surface-0] text-[--color-text-primary]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 border-b border-[--color-border-subtle] bg-[--color-surface-0]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[--color-brand-500] flex items-center justify-center shrink-0">
            <CodeXml size={14} className="text-white" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            FDCircle{' '}
            <span className="text-[--color-text-muted] font-normal">UAT</span>
          </span>
        </div>

        <nav className="flex items-center gap-3">
          <Badge variant="info">
            <CircleDot size={8} className="fill-current" />
            UAT
          </Badge>

          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Link
                href="/integrate"
                className="flex items-center gap-1 text-xs text-[--color-brand-400] hover:text-[--color-brand-300] transition-colors px-2.5 py-1.5 rounded-md bg-[--color-brand-500]/10 hover:bg-[--color-brand-500]/20"
              >
                <Wrench size={12} />
                Workbench
              </Link>
              <Link
                href="/admin/dashboard"
                className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors px-2.5 py-1.5 rounded-md hover:bg-[--color-surface-200]"
              >
                Dashboard
              </Link>
            </div>
          ) : (
            <Link
              href="/admin/login"
              className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors px-2.5 py-1.5 rounded-md hover:bg-[--color-surface-200]"
            >
              Admin
            </Link>
          )}
        </nav>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center gap-8">

        {/* Eyebrow */}
        <Badge variant="success" className="text-xs tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[--color-success] inline-block" />
          Live UAT Inventory
        </Badge>

        {/* Heading */}
        <div className="max-w-xl space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-[-0.03em] leading-[1.1] text-[--color-text-primary]">
            Flight API{' '}
            <span className="text-[--color-text-secondary] font-normal">
              Integration Portal
            </span>
          </h1>
          <p className="text-[--color-text-secondary] text-base leading-relaxed max-w-md mx-auto">
            Explore bookable sectors, generate cURL commands, browse TypeScript
            models, and test outsource flight booking APIs — all in one place.
          </p>
        </div>

        {/* Credential card */}
        <ClientCredentialCard />

        {/* Workbench card — Only visible to authenticated Admins */}
        {isAdmin && (
          <Link
            href="/integrate"
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[--color-brand-500]/40 bg-[--color-surface-100] hover:border-[--color-brand-500] hover:bg-[--color-surface-200] transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-[--color-brand-500]/10 flex items-center justify-center shrink-0">
              <Wrench size={15} className="text-[--color-brand-400]" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-[--color-text-primary]">Integration Workbench</p>
                <Badge variant="brand" className="text-[9px] py-0 px-1.5">
                  <ShieldCheck size={9} />
                  Admin
                </Badge>
              </div>
              <p className="text-[10px] text-[--color-text-muted]">Flow runner · JSON tools · Auto Logging</p>
            </div>
          </Link>
        )}

        {/* Feature pills */}
        <ul className="flex flex-wrap gap-2 justify-center" aria-label="Portal features">
          {features.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[--color-text-secondary] bg-[--color-surface-100] border border-[--color-border-subtle]"
            >
              <Icon size={12} className="text-[--color-text-muted]" />
              {label}
            </li>
          ))}
        </ul>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[--color-border-subtle] px-6 py-4 text-center">
        <p className="text-xs text-[--color-text-muted]">
          FDCircle UAT Portal · For integration &amp; testing use only
        </p>
      </footer>
    </div>
  )
}

