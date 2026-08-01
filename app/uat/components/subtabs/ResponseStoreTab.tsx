'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Copy, Check, Database } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import { MethodBadge } from '../MethodBadge'
import type { StoredResponse } from '../../types'
import type { ApiEndpoint } from '@/app/lib/api-catalog'

interface ResponseStoreTabProps {
  responseStore: Record<string, StoredResponse>
  catalog: ApiEndpoint[]
}

export default function ResponseStoreTab({ responseStore, catalog }: ResponseStoreTabProps) {
  const entries = Object.values(responseStore).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-8">
        <div className="w-10 h-10 rounded-xl bg-[--color-surface-200] border border-[--color-border-default] flex items-center justify-center">
          <Database size={16} className="text-[--color-text-muted]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[--color-text-secondary]">Response store is empty</p>
          <p className="text-xs text-[--color-text-muted] mt-1">
            Responses from all API calls will accumulate here — across all open tabs
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider">
            All Accumulated Responses
          </h3>
          <p className="text-[10px] text-[--color-text-muted] mt-0.5">
            {entries.length} response{entries.length !== 1 ? 's' : ''} · Persists across all open tabs until browser tab is closed
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => {
          const endpoint = catalog.find((e) => e.id === entry.endpointId)
          return (
            <ResponseEntry
              key={`${entry.tabId}-${entry.timestamp}`}
              entry={entry}
              endpoint={endpoint}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Response Entry ─────────────────────────────────────────────────────────────

function ResponseEntry({
  entry,
  endpoint,
}: {
  entry: StoredResponse
  endpoint?: ApiEndpoint
}) {
  const [expanded, setExpanded] = useState(false)

  const statusOk = entry.status >= 200 && entry.status < 300
  const statusColor = statusOk ? 'text-[--color-success]' : 'text-[--color-error]'

  const jsonStr = typeof entry.data === 'string'
    ? entry.data
    : JSON.stringify(entry.data, null, 2)

  return (
    <div className="border border-[--color-border-default] rounded-xl overflow-hidden bg-[--color-surface-0]">
      {/* Header row */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[--color-surface-100] transition-colors cursor-pointer"
      >
        {expanded
          ? <ChevronDown size={13} className="text-[--color-text-muted] shrink-0" />
          : <ChevronRight size={13} className="text-[--color-text-muted] shrink-0" />
        }

        {endpoint && <MethodBadge method={endpoint.method} className="shrink-0" />}

        <span className="text-xs font-medium text-[--color-text-primary] truncate">
          {entry.endpointName}
        </span>

        <span className={cn('text-xs font-semibold ml-auto shrink-0', statusColor)}>
          {entry.status}
        </span>

        <span className="text-[10px] text-[--color-text-muted] shrink-0">
          {entry.durationMs}ms
        </span>

        <span className="text-[10px] text-[--color-text-muted] shrink-0 hidden sm:block">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </span>
      </button>

      {/* Expanded JSON */}
      {expanded && (
        <div className="border-t border-[--color-border-subtle]">
          <div className="flex justify-end px-4 pt-2">
            <CopyButton text={jsonStr} />
          </div>
          <pre className="px-4 pb-4 pt-2 text-xs font-mono text-[--color-text-secondary] overflow-x-auto leading-relaxed whitespace-pre-wrap break-words max-h-[400px] overflow-y-auto">
            {jsonStr}
          </pre>
        </div>
      )}
    </div>
  )
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    catch { /* ignore */ }
  }
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors cursor-pointer">
      {copied ? <Check size={11} className="text-[--color-success]" /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}
