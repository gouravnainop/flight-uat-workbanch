import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plane, Zap, Code2, Settings, LogOut, Activity, Layers, FlaskConical, Wrench, ArrowRight, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'
import { getSession } from '@/app/lib/session'
import { logoutAction } from '@/app/actions/auth'
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/app/components/ui'

export const metadata: Metadata = {
  title: 'Admin Dashboard — FDCircle UAT',
  robots: { index: false, follow: false },
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface StatCard {
  label: string
  value: string
  note: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

interface SectionCard {
  title: string
  description: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href?: string
  badge?: string
}

// ── Data ───────────────────────────────────────────────────────────────────────

const stats: StatCard[] = [
  { label: 'Integration Workbench', value: 'Active', note: 'Flow runner ready',  icon: Wrench      },
  { label: 'API Endpoints',         value: '—',      note: 'Coming soon',        icon: Zap         },
  { label: 'Bookable Sectors',      value: '—',      note: 'Coming soon',        icon: Plane       },
  { label: 'Environment',           value: 'UAT',    note: 'Non-production',     icon: FlaskConical },
]

const sections: SectionCard[] = [
  {
    title:       'Flight Inventory',
    description: 'View all available UAT sectors, routes, and schedule data.',
    icon:        Plane,
    badge:       'Soon',
  },
  {
    title:       'API Explorer',
    description: 'Browse endpoints, generate cURL commands, and test live.',
    icon:        Zap,
    badge:       'Soon',
  },
  {
    title:       'TypeScript Models',
    description: 'Browse auto-generated TS interfaces and Zod schemas.',
    icon:        Code2,
    badge:       'Soon',
  },
  {
    title:       'Admin Settings',
    description: 'Manage admin users, API keys, and environment config.',
    icon:        Settings,
    badge:       'Soon',
  },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/admin/login')

  const initials = (session.email ?? 'A').charAt(0).toUpperCase()

  return (
    <div className="min-h-dvh flex flex-col bg-[--color-surface-0] text-[--color-text-primary]">

      {/* ── Topnav ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-6 bg-[--color-surface-100] border-b border-[--color-border-subtle]">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-[--color-surface-200] border border-[--color-border-default] flex items-center justify-center">
              <Plane size={13} className="text-[--color-brand-400]" strokeWidth={2.2} />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              FDCircle{' '}
              <span className="text-[--color-text-muted] font-normal">UAT</span>
            </span>
          </Link>
          <Badge variant="brand" className="text-[10px] tracking-widest uppercase">
            Admin
          </Badge>
        </div>

        {/* User + Workbench Shortcut + Logout */}
        <div className="flex items-center gap-3">
          <Link
            href="/integrate"
            className="flex items-center gap-1.5 text-xs text-[--color-brand-400] hover:text-[--color-brand-300] bg-[--color-brand-500]/10 hover:bg-[--color-brand-500]/20 px-3 py-1.5 rounded-lg font-medium transition-all"
          >
            <Wrench size={13} />
            Launch Workbench
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-[--color-border-subtle]">
            <div className="w-7 h-7 rounded-full bg-[--color-surface-300] border border-[--color-border-default] flex items-center justify-center text-xs font-semibold text-[--color-text-secondary]">
              {initials}
            </div>
            <span className="text-xs text-[--color-text-secondary] max-w-[180px] truncate hidden sm:block">
              {session.email}
            </span>
          </div>

          <form action={logoutAction}>
            <Button
              id="logout-btn"
              type="submit"
              variant="ghost"
              size="sm"
            >
              <LogOut size={13} />
              Sign out
            </Button>
          </form>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 px-6 py-10 max-w-5xl w-full mx-auto space-y-8">

        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">Admin Dashboard</h1>
          <p className="text-sm text-[--color-text-secondary] mt-1">
            Welcome back,{' '}
            <span className="text-[--color-text-primary] font-medium">{session.email}</span>
          </p>
        </div>

        {/* ── Featured Tool Banner: Integration Workbench ── */}
        <Link
          href="/integrate"
          className="group block p-6 rounded-2xl border border-[--color-brand-500]/30 bg-gradient-to-r from-[--color-brand-500]/10 via-[--color-surface-100] to-[--color-surface-100] hover:border-[--color-brand-500] hover:shadow-lg transition-all"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[--color-brand-500]/20 border border-[--color-brand-500]/30 flex items-center justify-center shrink-0">
                <Wrench size={22} className="text-[--color-brand-400]" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-[--color-text-primary] group-hover:text-[--color-brand-300] transition-colors">
                    Integration Workbench
                  </h2>
                  <Badge variant="success" className="text-[10px]">
                    <Sparkles size={9} />
                    Admin Active
                  </Badge>
                </div>
                <p className="text-xs text-[--color-text-secondary] max-w-xl leading-relaxed">
                  Run multi-step provider flight search and booking flows, configure payload mappings, inspect responses, and test live integration adapters.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-[--color-brand-400] group-hover:translate-x-1 transition-transform">
              Open Tool
              <ArrowRight size={14} />
            </div>
          </div>
        </Link>

        {/* ── Stats ── */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Overview statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {stats.map(({ label, value, note, icon: Icon }) => (
              <Card key={label} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[--color-text-muted] font-medium">{label}</span>
                  <Icon size={14} className="text-[--color-text-muted]" />
                </div>
                <div>
                  <p className="text-2xl font-bold tracking-tight">{value}</p>
                  <p className="text-xs text-[--color-text-muted] mt-0.5">{note}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Sections ── */}
        <section aria-labelledby="sections-heading">
          <h2 id="sections-heading" className="text-sm font-semibold text-[--color-text-secondary] mb-3">
            Platform Modules
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {sections.map(({ title, description, icon: Icon, badge }) => (
              <Card
                key={title}
                className="p-5 flex gap-4 transition-colors hover:border-[--color-border-strong] hover:bg-[--color-surface-200] cursor-default"
              >
                <div className="w-9 h-9 rounded-lg bg-[--color-surface-200] border border-[--color-border-default] flex items-center justify-center shrink-0">
                  <Icon size={15} className="text-[--color-text-secondary]" />
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[--color-text-primary]">{title}</p>
                    {badge && <Badge variant="default" className="text-[10px]">{badge}</Badge>}
                  </div>
                  <p className="text-xs text-[--color-text-muted] leading-relaxed">{description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Session info ── */}
        <section aria-labelledby="session-heading">
          <h2 id="session-heading" className="text-sm font-semibold text-[--color-text-secondary] mb-3 flex items-center gap-2">
            <Layers size={13} />
            Session
          </h2>
          <Card className="p-0 overflow-hidden">
            <table className="w-full text-xs" aria-label="Session information">
              <tbody>
                {(
                  [
                    ['Role',    session.role],
                    ['Email',   session.email],
                    ['Issued',  session.iat ? new Date(session.iat * 1000).toISOString() : '—'],
                    ['Expires', session.exp ? new Date(session.exp * 1000).toISOString() : '—'],
                  ] as [string, string][]
                ).map(([key, val], i) => (
                  <tr
                    key={key}
                    className={i !== 0 ? 'border-t border-[--color-border-subtle]' : ''}
                  >
                    <td className="px-4 py-2.5 text-[--color-text-muted] w-20 shrink-0 font-medium">
                      {key}
                    </td>
                    <td className="px-4 py-2.5 text-[--color-text-secondary] font-mono">
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </section>

      </main>
    </div>
  )
}

