'use client'

import { useState, useEffect } from 'react'
import { WorkbenchState, WorkbenchTool, WORKBENCH_STORAGE_KEY } from './types'
import IntegrateHeader from './components/IntegrateHeader'
import ProviderSidebar from './components/ProviderSidebar'
import FlowRunner from './components/tools/FlowRunner'
import type { ProviderConfig, ProviderFlow } from './types'

function defaultState(): WorkbenchState {
  return {
    activeTool: 'flow',
    providers: [],
    activeProviderId: null,
    flows: {},
    activeFlowId: null,
    normSession: null,
    postmanEndpoints: [],
  }
}

interface IntegrateExplorerProps {
  adminEmail?: string
}

export default function IntegrateExplorer({ adminEmail }: IntegrateExplorerProps) {
  const [state, setState] = useState<WorkbenchState>(defaultState)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(WORKBENCH_STORAGE_KEY)
      if (raw) setState(JSON.parse(raw))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  // Persist to sessionStorage
  useEffect(() => {
    if (hydrated) {
      try { sessionStorage.setItem(WORKBENCH_STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
    }
  }, [state, hydrated])

  const setTool = (tool: WorkbenchTool) => setState((prev) => ({ ...prev, activeTool: tool }))

  const activeProvider = state.providers.find((p) => p.id === state.activeProviderId) ?? null

  const renderTool = () => {
    switch (state.activeTool) {
      case 'flow':
        return (
          <FlowRunner
            provider={activeProvider}
            flows={state.flows}
            onUpdateFlows={(flows: Record<string, ProviderFlow>) => setState((p) => ({ ...p, flows }))}
          />
        )
      default:
        return null
    }
  }

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[--color-surface-0]">
        <div className="w-5 h-5 rounded-full border-2 border-t-[--color-brand-500] border-[--color-surface-300] animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-[--color-surface-0] text-[--color-text-primary] overflow-hidden">
      <IntegrateHeader
        activeTool={state.activeTool}
        onSetTool={setTool}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((p) => !p)}
        adminEmail={adminEmail}
      />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <ProviderSidebar
            providers={state.providers}
            activeProviderId={state.activeProviderId}
            onSelect={(id) => setState((p) => ({ ...p, activeProviderId: id }))}
            onAdd={(provider: ProviderConfig) => setState((p) => ({ ...p, providers: [...p.providers, provider] }))}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        <div className="flex-1 overflow-hidden">
          {renderTool()}
        </div>
      </div>
    </div>
  )
}
