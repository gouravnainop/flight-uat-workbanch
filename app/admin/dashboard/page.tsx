import { redirect } from 'next/navigation'
import { Plane, Zap, Code2, Settings, LogOut, Activity, Layers, FlaskConical } from 'lucide-react'
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
}

// ── Data ───────────────────────────────────────────────────────────────────────

const stats: StatCard[] = [
  { label: 'API Endpoints',    value: '—',   note: 'Coming soon',     icon: Zap         },
  { label: 'Bookable Sectors', value: '—',   note: 'Coming soon',     icon: Plane       },
  { label: 'Active Sessions',  value: '1',   note: 'Current session', icon: Activity    },
  { label: 'Environment',      value: 'UAT', note: 'Non-production',  icon: FlaskConical },
]

const sections: SectionCard[] = [
  {
    title:       'Flight Inventory',
    description: 'View all available UAT sectors, routes, and schedule data.',
    icon:        Plane,
  },
  {
    title:       'API Explorer',
    description: 'Browse endpoints, generate cURL commands, and test live.',
    icon:        Zap,
  },
  {
    title:       'TypeScript Models',
    description: 'Browse auto-generated TS interfaces and Zod schemas.',
    icon:        Code2,
  },
  {
    title:       'Admin Settings',
    description: 'Manage admin users, API keys, and environment config.',
    icon:        Settings,
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
          <div className="w-7 h-7 rounded-lg bg-[--color-surface-200] border border-[--color-border-default] flex items-center justify-center">
            <Plane size={13} className="text-[--color-brand-400]" strokeWidth={2.2} />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            FDCircle{' '}
            <span className="text-[--color-text-muted] font-normal">UAT</span>
          </span>
          <Badge variant="brand" className="text-[10px] tracking-widest uppercase">
            Admin
          </Badge>
        </div>

        {/* User + Logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
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
      <main className="flex-1 px-6 py-10 max-w-5xl w-full mx-auto space-y-10">

        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em]">Dashboard</h1>
          <p className="text-sm text-[--color-text-secondary] mt-1">
            Welcome back,{' '}
            <span className="text-[--color-text-primary] font-medium">{session.email}</span>
          </p>
        </div>

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
            Sections
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {sections.map(({ title, description, icon: Icon }) => (
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
                    <Badge variant="default" className="text-[10px]">Soon</Badge>
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
