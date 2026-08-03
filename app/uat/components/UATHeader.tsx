'use client'

import Link from 'next/link'
import { Plane, PanelLeftOpen, PanelLeftClose, LogOut, KeyRound, CheckCircle2, CodeXml, Wrench } from 'lucide-react'
import { deauthorizeClientAction } from '@/app/actions/client-auth'
import { Button, Badge } from '@/app/components/ui'

interface UATHeaderProps {
  sidebarOpen: boolean
  onToggleSidebar: () => void
  apiKey: string
}

export default function UATHeader({ sidebarOpen, onToggleSidebar, apiKey }: UATHeaderProps) {
  const maskedKey = apiKey
    ? `${apiKey.slice(0, 8)}${'•'.repeat(Math.max(0, apiKey.length - 8))}`
    : '—'

  return (
    <header className="flex items-center justify-between h-12 px-4 border-b border-[--color-border-subtle] bg-[--color-surface-100] shrink-0 gap-3">
      {/* Left: toggle + brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className="p-1.5 rounded-md text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-surface-200] transition-colors"
        >
          {sidebarOpen
            ? <PanelLeftClose size={16} />
            : <PanelLeftOpen  size={16} />
          }
        </button>

        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-md bg-[--color-surface-200] border border-[--color-border-default] flex items-center justify-center">
            <CodeXml size={12} className="text-[--color-brand-400]" strokeWidth={2.2} />
          </div>
          <span className="text-xs font-semibold text-[--color-text-primary] group-hover:text-[--color-text-secondary] transition-colors">
            FDCircle <span className="text-[--color-text-muted] font-normal">UAT</span>
          </span>
        </Link>

        <Badge variant="success" className="text-[10px]">
          <CheckCircle2 size={9} />
          Authorized
        </Badge>
      </div>

      {/* Right: key info + logout */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[--color-text-muted] font-mono px-2 py-1 rounded-md bg-[--color-surface-200] border border-[--color-border-subtle]">
          <KeyRound size={10} />
          {maskedKey}
        </div>

        <form action={deauthorizeClientAction}>
          <Button type="submit" variant="ghost" size="sm" className="text-xs h-7 px-2.5">
            <LogOut size={12} />
            <span className="hidden sm:inline">Deauthorize</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
