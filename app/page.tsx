import Link from 'next/link'
import {
  Plane,
  Zap,
  Code2,
  BookOpen,
  KeyRound,
  CircleDot,
} from 'lucide-react'
import { Badge } from '@/app/components/ui'
import { ClientCredentialCard } from '@/app/components/ClientCredentialCard'

// ── Feature list ───────────────────────────────────────────────────────────────

interface Feature {
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}

const features: Feature[] = [
  { icon: Plane,    label: 'Bookable Sectors'  },
  { icon: Zap,      label: 'Live cURL Builder'  },
  { icon: Code2,    label: 'TypeScript Models'  },
  { icon: BookOpen, label: 'API Reference'       },
  { icon: KeyRound, label: 'Key-Based Auth'      },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-dvh bg-[--color-surface-0] text-[--color-text-primary]">

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 h-14 border-b border-[--color-border-subtle] bg-[--color-surface-0]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[--color-brand-500] flex items-center justify-center shrink-0">
            <Plane size={14} className="text-white" strokeWidth={2.2} />
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
          <Link
            href="/admin/login"
            className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors px-2.5 py-1.5 rounded-md hover:bg-[--color-surface-200]"
          >
            Admin
          </Link>
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
