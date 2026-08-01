'use client'

import { cn } from '@/app/lib/utils'
import { MethodBadge } from './MethodBadge'
import TryItTab from './subtabs/TryItTab'
import CurlTab from './subtabs/CurlTab'
import TypeScriptTab from './subtabs/TypeScriptTab'
import ResponseStoreTab from './subtabs/ResponseStoreTab'
import type { ApiTab, StoredResponse, SubTab } from '../types'
import type { ApiEndpoint } from '@/app/lib/api-catalog'

interface ApiTabContentProps {
  tab: ApiTab
  catalog: ApiEndpoint[]
  credentials: { apiKey: string; apiSecret: string }
  responseStore: Record<string, StoredResponse>
  onUpdateTab: (patch: Partial<ApiTab>) => void
  onSendRequest: () => void
}

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: 'try', label: 'Try it' },
  { id: 'curl', label: 'cURL' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'store', label: 'Response Store' },
]

export default function ApiTabContent({
  tab,
  catalog,
  credentials,
  responseStore,
  onUpdateTab,
  onSendRequest,
}: ApiTabContentProps) {
  const endpoint = catalog.find((e) => e.id === tab.endpointId)
  if (!endpoint) return <div className="p-6 text-sm text-[--color-text-muted]">Endpoint not found.</div>

  const storeCount = Object.keys(responseStore).length

  return (
    <div className="flex flex-col h-full">

      {/* Endpoint info bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[--color-border-subtle] bg-[--color-surface-50] shrink-0 justify-between">
        <code className="text-xs font-mono text-[--color-text-secondary] flex items-center gap-x-2">
          <MethodBadge method={endpoint.method} />
          {endpoint.path}
        </code>
        <code>
          <span className="text-xs text-[--color-text-muted] hidden md:block">{endpoint.description}</span>
        </code>
      </div>

      {/* Sub-tab bar */}
      <div className="flex items-center gap-1 px-5 border-b border-[--color-border-subtle] bg-[--color-surface-50] shrink-0">
        {SUB_TABS.map((st) => (
          <button
            key={st.id}
            onClick={() => onUpdateTab({ activeSubTab: st.id })}
            className={cn(
              'relative px-3 py-2.5 text-xs transition-colors cursor-pointer',
              tab.activeSubTab === st.id
                ? 'text-[--color-text-primary] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[--color-brand-500]'
                : 'text-[--color-text-muted] hover:text-[--color-text-secondary]',
            )}
          >
            {st.label}
            {st.id === 'store' && storeCount > 0 && (
              <span className="ml-1.5 text-[10px] px-1.5 py-px rounded-full bg-[--color-surface-300] text-[--color-text-muted]">
                {storeCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      <div className="flex-1 overflow-auto">
        {tab.activeSubTab === 'try' && (
          <TryItTab
            tab={tab}
            endpoint={endpoint}
            onUpdateTab={onUpdateTab}
            onSendRequest={onSendRequest}
          />
        )}
        {tab.activeSubTab === 'curl' && (
          <CurlTab tab={tab} endpoint={endpoint} credentials={credentials} />
        )}
        {tab.activeSubTab === 'typescript' && (
          <TypeScriptTab endpoint={endpoint} />
        )}
        {tab.activeSubTab === 'store' && (
          <ResponseStoreTab responseStore={responseStore} catalog={catalog} />
        )}
      </div>
    </div>
  )
}
