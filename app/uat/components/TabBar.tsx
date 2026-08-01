'use client'

import { X, Plus } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { METHOD_COLORS } from './MethodBadge'
import type { ApiTab } from '../types'
import type { ApiEndpoint } from '@/app/lib/api-catalog'

interface TabBarProps {
  tabs: ApiTab[]
  catalog: ApiEndpoint[]
  activeTabId: string | null
  onSelect: (tabId: string) => void
  onClose: (tabId: string) => void
  onOpenSidebar: () => void
}

export default function TabBar({
  tabs,
  catalog,
  activeTabId,
  onSelect,
  onClose,
  onOpenSidebar,
}: TabBarProps) {
  return (
    <div className="flex items-center h-10 border-b border-[--color-border-subtle] bg-[--color-surface-50] overflow-x-auto shrink-0 scrollbar-thin">
      {tabs.map((tab) => {
        const endpoint = catalog.find((e) => e.id === tab.endpointId)
        const isActive = tab.id === activeTabId
        const methodColor = endpoint ? METHOD_COLORS[endpoint.method] : 'text-[--color-text-muted]'

        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={cn(
              'group flex items-center gap-2 h-full px-3 text-xs border-r border-[--color-border-subtle] cursor-pointer shrink-0 max-w-[200px] transition-colors select-none',
              isActive
                ? 'bg-[--color-surface-0] text-[--color-text-primary] border-b-2 border-b-[--color-brand-500]'
                : 'text-[--color-text-muted] hover:bg-[--color-surface-100] hover:text-[--color-text-secondary]',
            )}
          >
            {/* Method indicator dot */}
            <span className={cn('text-[10px] font-bold font-mono shrink-0', methodColor)}>
              {endpoint?.method ?? '?'}
            </span>

            {/* Endpoint name */}
            <span className="truncate min-w-0">
              {endpoint?.name ?? tab.endpointId}
            </span>

            {/* Loading indicator */}
            {tab.isLoading && (
              <span className="w-2.5 h-2.5 rounded-full border border-[--color-border-strong] border-t-[--color-brand-500] animate-spin shrink-0" />
            )}

            {/* Close button */}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(tab.id) }}
              aria-label={`Close ${endpoint?.name ?? 'tab'}`}
              className={cn(
                'shrink-0 p-0.5 rounded transition-opacity',
                isActive ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-60',
                'hover:bg-[--color-surface-300]',
              )}
            >
              <X size={11} />
            </button>
          </div>
        )
      })}

      {/* New tab button */}
      <button
        onClick={onOpenSidebar}
        aria-label="Open API browser"
        title="Open API browser"
        className="flex items-center justify-center h-full px-3 text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-surface-100] transition-colors shrink-0"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
