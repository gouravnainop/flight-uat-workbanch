'use client'

import { X, Search } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/app/lib/utils'
import { API_CATEGORIES, type ApiCategory, type ApiEndpoint } from '@/app/lib/api-catalog'
import { MethodBadge } from './MethodBadge'

interface ApiSidebarProps {
  catalog: ApiEndpoint[]
  openTabIds: string[]
  onSelect: (endpoint: ApiEndpoint) => void
  onClose: () => void
}

export default function ApiSidebar({ catalog, openTabIds, onSelect, onClose }: ApiSidebarProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? catalog.filter(
        (ep) =>
          ep.name.toLowerCase().includes(query.toLowerCase()) ||
          ep.path.toLowerCase().includes(query.toLowerCase()) ||
          ep.category.toLowerCase().includes(query.toLowerCase()),
      )
    : catalog

  return (
    <aside className="w-64 flex flex-col border-r border-[--color-border-subtle] bg-[--color-surface-50] shrink-0 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-[--color-border-subtle] shrink-0">
        <span className="text-xs font-semibold text-[--color-text-secondary]">APIs</span>
        <button
          onClick={onClose}
          aria-label="Close sidebar"
          className="p-1 rounded cursor-pointer text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-surface-200] transition-colors"
        >
          <X size={13} />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-[--color-border-subtle] shrink-0">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--color-text-muted]" />
          <input
            type="text"
            placeholder="Filter endpoints…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-7 pl-7 pr-3 text-xs rounded-md border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand-500] transition-colors"
          />
        </div>
      </div>

      {/* Endpoint list */}
      <nav className="flex-1 overflow-y-auto py-1" aria-label="API endpoints">
        {query.trim()
          ? <EndpointGroup endpoints={filtered} openTabIds={openTabIds} onSelect={onSelect} />
          : API_CATEGORIES.map((cat) => {
              const eps = catalog.filter((ep) => ep.category === cat)
              if (!eps.length) return null
              return (
                <CategorySection
                  key={cat}
                  category={cat}
                  endpoints={eps}
                  openTabIds={openTabIds}
                  onSelect={onSelect}
                />
              )
            })
        }
      </nav>
    </aside>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CategorySection({
  category,
  endpoints,
  openTabIds,
  onSelect,
}: {
  category: ApiCategory
  endpoints: ApiEndpoint[]
  openTabIds: string[]
  onSelect: (ep: ApiEndpoint) => void
}) {
  return (
    <div className="mb-1">
      <div className="px-3 py-1.5 text-[10px] font-semibold text-[--color-text-muted] uppercase tracking-widest">
        {category}
      </div>
      <EndpointGroup endpoints={endpoints} openTabIds={openTabIds} onSelect={onSelect} />
    </div>
  )
}

function EndpointGroup({
  endpoints,
  openTabIds,
  onSelect,
}: {
  endpoints: ApiEndpoint[]
  openTabIds: string[]
  onSelect: (ep: ApiEndpoint) => void
}) {
  return (
    <>
      {endpoints.map((ep) => {
        const isOpen = openTabIds.includes(ep.id)
        return (
          <button
            key={ep.id}
            onClick={() => onSelect(ep)}
            className={cn(
              'w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors cursor-pointer',
              isOpen
                ? 'bg-[--color-brand-500]/8 text-[--color-text-primary]'
                : 'text-[--color-text-secondary] hover:bg-[--color-surface-200] hover:text-[--color-text-primary]',
            )}
          >
            <MethodBadge method={ep.method} className="mt-px shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{ep.name}</p>
              <p className="text-[10px] text-[--color-text-muted] font-mono truncate mt-0.5">
                {ep.path}
              </p>
            </div>
          </button>
        )
      })}
    </>
  )
}
