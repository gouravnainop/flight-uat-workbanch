'use client'

import { useState } from 'react'
import { Plus, Server, ChevronRight, Trash2, X } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import type { ProviderConfig } from '@/app/integrate/types'

const AUTH_TYPES: ProviderConfig['authType'][] = ['none', 'api-key', 'bearer', 'basic']

interface Props {
  providers: ProviderConfig[]
  activeProviderId: string | null
  onSelect: (id: string) => void
  onAdd: (provider: ProviderConfig) => void
  onClose: () => void
}

function nanoid(n = 8) {
  return Math.random().toString(36).slice(2, 2 + n)
}

export default function ProviderSidebar({ providers, activeProviderId, onSelect, onAdd, onClose }: Props) {
  const [showForm, setShowForm] = useState(providers.length === 0)
  const [form, setForm] = useState<Omit<ProviderConfig, 'id' | 'createdAt'>>({
    name: '',
    baseUrl: '',
    authType: 'none',
    authHeaders: {},
  })
  const [headerPairs, setHeaderPairs] = useState<Array<{ key: string; value: string }>>([])

  const saveProvider = () => {
    if (!form.name.trim() || !form.baseUrl.trim()) return
    const headers: Record<string, string> = {}
    headerPairs.forEach(({ key, value }) => { if (key) headers[key] = value })
    const p: ProviderConfig = {
      id: nanoid(),
      ...form,
      authHeaders: headers,
      createdAt: new Date().toISOString(),
    }
    onAdd(p)
    setShowForm(false)
    setForm({ name: '', baseUrl: '', authType: 'none', authHeaders: {} })
    setHeaderPairs([])
  }

  return (
    <aside className="w-64 flex flex-col border-r border-[--color-border-subtle] bg-[--color-surface-50] shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[--color-border-subtle]">
        <Server size={13} className="text-[--color-text-muted]" />
        <span className="text-xs font-semibold text-[--color-text-secondary]">Providers</span>
        <button onClick={() => setShowForm((v) => !v)}
          className="ml-auto p-1 rounded-md text-[--color-text-muted] hover:text-[--color-brand-400] hover:bg-[--color-brand-500]/10 transition-colors cursor-pointer">
          <Plus size={14} />
        </button>
        <button onClick={onClose}
          className="p-1 rounded-md text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-surface-200] transition-colors cursor-pointer">
          <X size={13} />
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="px-4 py-3 border-b border-[--color-border-subtle] space-y-2 bg-[--color-surface-0]">
          <p className="text-[10px] font-semibold text-[--color-text-muted] uppercase tracking-wider">New Provider</p>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Provider name" className="w-full h-7 px-2.5 text-xs rounded-md border border-[--color-border-default] bg-[--color-surface-50] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand-500] transition-colors" />
          <input value={form.baseUrl} onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
            placeholder="https://api.provider.com" className="w-full h-7 px-2.5 text-xs font-mono rounded-md border border-[--color-border-default] bg-[--color-surface-50] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand-500] transition-colors" />
          <select value={form.authType} onChange={(e) => setForm((f) => ({ ...f, authType: e.target.value as ProviderConfig['authType'] }))}
            className="w-full h-7 px-2 text-xs rounded-md border border-[--color-border-default] bg-[--color-surface-50] text-[--color-text-primary] focus:outline-none focus:border-[--color-brand-500] transition-colors cursor-pointer">
            {AUTH_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          {/* Auth headers */}
          {headerPairs.map((pair, i) => (
            <div key={i} className="flex gap-1 flex-col h-12">
              <input value={pair.key} onChange={(e) => { const p = [...headerPairs]; p[i] = { ...pair, key: e.target.value }; setHeaderPairs(p) }}
                placeholder="Header" className="flex-1 h-6 px-2 text-[10px] font-mono rounded border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] focus:outline-none focus:border-[--color-brand-500] transition-colors" />
              <input value={pair.value} onChange={(e) => { const p = [...headerPairs]; p[i] = { ...pair, value: e.target.value }; setHeaderPairs(p) }}
                placeholder="Value" className="flex-1 h-6 px-2 text-[10px] font-mono rounded border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] focus:outline-none focus:border-[--color-brand-500] transition-colors" />
            </div>
          ))}
          <button onClick={() => setHeaderPairs((p) => [...p, { key: '', value: '' }])}
            className="text-[10px] text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors cursor-pointer">
            + Add header
          </button>
          <button onClick={saveProvider} disabled={!form.name || !form.baseUrl}
            className="w-full text-xs py-1.5 rounded-md bg-[--color-brand-500] text-white hover:bg-[--color-brand-600] disabled:opacity-40 transition-colors cursor-pointer font-medium">
            Save Provider
          </button>
        </div>
      )}

      {/* Provider list */}
      <div className="flex-1 overflow-auto py-2">
        {providers.length === 0 && !showForm && (
          <p className="px-4 py-6 text-xs text-center text-[--color-text-muted]">No providers yet.<br />Click + to add one.</p>
        )}
        {providers.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer',
              activeProviderId === p.id
                ? 'bg-[--color-brand-500]/10 border-r-2 border-[--color-brand-500]'
                : 'hover:bg-[--color-surface-100]'
            )}
          >
            <div className={cn('w-2 h-2 rounded-full shrink-0',
              activeProviderId === p.id ? 'bg-[--color-brand-400]' : 'bg-[--color-surface-400]'
            )} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[--color-text-primary] truncate">{p.name}</p>
              <p className="text-[10px] text-[--color-text-muted] font-mono truncate">{p.baseUrl}</p>
            </div>
            <ChevronRight size={12} className="text-[--color-text-muted] shrink-0" />
          </button>
        ))}
      </div>
    </aside>
  )
}
