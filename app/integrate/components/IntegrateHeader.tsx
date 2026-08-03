'use client'

import Link from 'next/link'
import { CodeXml, GitBranch, PanelLeftOpen, PanelLeftClose, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react'
import { logoutAction } from '@/app/actions/auth'
import { Badge, Button } from '@/app/components/ui'
import { cn } from '@/app/lib/utils'
import type { WorkbenchTool } from '@/app/integrate/types'

const TOOLS: { id: WorkbenchTool; label: string; icon: React.ReactNode }[] = [
  { id: 'flow', label: 'Flow Runner', icon: <GitBranch size={13} /> },
]

interface Props {
  activeTool: WorkbenchTool
  onSetTool: (tool: WorkbenchTool) => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
  adminEmail?: string
}

export default function IntegrateHeader({
  activeTool,
  onSetTool,
  sidebarOpen,
  onToggleSidebar,
  adminEmail,
}: Props) {
  return (
    <header className="flex items-center gap-3 px-4 h-12 border-b border-[--color-border-subtle] bg-[--color-surface-50] shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        className="p-1.5 rounded-md text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-surface-200] transition-colors cursor-pointer"
      >
        {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
      </button>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 group shrink-0">
        <div className="w-6 h-6 rounded-md bg-[--color-surface-200] border border-[--color-border-default] flex items-center justify-center">
          <CodeXml size={12} className="text-[--color-brand-400]" strokeWidth={2.2} />
        </div>
        <span className="text-xs font-semibold text-[--color-text-primary] group-hover:text-[--color-text-secondary] transition-colors hidden sm:block">
          FDCircle <span className="text-[--color-text-muted] font-normal">Workbench</span>
        </span>
      </Link>

      <Badge variant="brand" className="text-[9px] py-0 px-1.5">
        <ShieldCheck size={9} />
        Admin
      </Badge>

      {/* Divider */}
      <div className="w-px h-5 bg-[--color-border-default] mx-1" />

      {/* Tool tab pills */}
      <nav className="flex items-center gap-0.5 overflow-x-auto">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            onClick={() => onSetTool(t.id)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer font-medium whitespace-nowrap',
              activeTool === t.id
                ? 'bg-[--color-brand-500]/10 text-[--color-brand-400]'
                : 'text-[--color-text-muted] hover:text-[--color-text-secondary]'
            )}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Controls: Dashboard link + email + logout */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-1.5 text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors px-2 py-1 rounded-md hover:bg-[--color-surface-200]"
        >
          <LayoutDashboard size={12} />
          <span className="hidden md:inline">Dashboard</span>
        </Link>

        {adminEmail && (
          <span className="text-[11px] text-[--color-text-muted] font-mono max-w-[150px] truncate hidden lg:inline">
            {adminEmail}
          </span>
        )}

        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" className="text-xs h-7 px-2.5">
            <LogOut size={12} />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </form>
      </div>
    </header>
  )
}

