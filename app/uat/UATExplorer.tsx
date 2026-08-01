'use client'

import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { nanoid } from 'nanoid'
import type { ApiEndpoint } from '@/app/lib/api-catalog'
import type { ApiTab, UATExplorerState, StoredResponse } from './types'
import { STORAGE_KEY, CREDS_KEY_STORAGE, CREDS_SECRET_STORAGE } from './types'
import TabBar from './components/TabBar'
import ApiSidebar from './components/ApiSidebar'
import ApiTabContent from './components/ApiTabContent'
import UATHeader from './components/UATHeader'
import EmptyState from './components/EmptyState'

// ── Props ──────────────────────────────────────────────────────────────────────

interface UATExplorerProps {
  catalog: ApiEndpoint[]
}

// ── Default state ──────────────────────────────────────────────────────────────

function defaultState(): UATExplorerState {
  return { tabs: [], activeTabId: null, responseStore: {}, sidebarOpen: true }
}

// ── Persist helpers ────────────────────────────────────────────────────────────

function saveState(state: UATExplorerState): void {
  try {
    // Don't persist isLoading — reset on load
    const clean: UATExplorerState = {
      ...state,
      tabs: state.tabs.map((t) => ({ ...t, isLoading: false, error: undefined })),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clean))
  } catch { /* storage unavailable */ }
}

function loadState(): UATExplorerState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return JSON.parse(raw) as UATExplorerState
  } catch {
    return defaultState()
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function UATExplorer({ catalog }: UATExplorerProps) {
  const [state, setState] = useState<UATExplorerState>(defaultState)
  const [credentials, setCredentials] = useState({ apiKey: '', apiSecret: '' })
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from sessionStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setState(loadState())
    setCredentials({
      apiKey:    sessionStorage.getItem(CREDS_KEY_STORAGE)    ?? '',
      apiSecret: sessionStorage.getItem(CREDS_SECRET_STORAGE) ?? '',
    })
    setHydrated(true)
  }, [])

  // Persist on every state change
  useEffect(() => {
    if (hydrated) saveState(state)
  }, [state, hydrated])

  // ── Tab operations ─────────────────────────────────────────────────────────

  const openTab = useCallback((endpoint: ApiEndpoint) => {
    setState((prev) => {
      // If this endpoint is already open, just focus it
      const existing = prev.tabs.find((t) => t.endpointId === endpoint.id)
      if (existing) {
        return { ...prev, activeTabId: existing.id, sidebarOpen: true }
      }

      const tab: ApiTab = {
        id: nanoid(8),
        endpointId: endpoint.id,
        pathParamValues: Object.fromEntries(
          (endpoint.pathParams ?? []).map((p) => [p.name, p.example]),
        ),
        queryParamValues: Object.fromEntries(
          (endpoint.queryParams ?? []).map((p) => [p.name, p.example ?? '']),
        ),
        requestBody: endpoint.sampleRequest != null
          ? JSON.stringify(endpoint.sampleRequest, null, 2)
          : '',
        isLoading: false,
        activeSubTab: 'try',
      }

      return {
        ...prev,
        tabs: [...prev.tabs, tab],
        activeTabId: tab.id,
        sidebarOpen: true,
      }
    })
  }, [])

  const closeTab = useCallback((tabId: string) => {
    setState((prev) => {
      const idx = prev.tabs.findIndex((t) => t.id === tabId)
      const newTabs = prev.tabs.filter((t) => t.id !== tabId)
      // Pick adjacent tab as active
      let newActive: string | null = prev.activeTabId
      if (prev.activeTabId === tabId) {
        newActive = newTabs[Math.min(idx, newTabs.length - 1)]?.id ?? null
      }
      return { ...prev, tabs: newTabs, activeTabId: newActive }
    })
  }, [])

  const setActiveTab = useCallback((tabId: string) => {
    setState((prev) => ({ ...prev, activeTabId: tabId }))
  }, [])

  const updateTab = useCallback((tabId: string, patch: Partial<ApiTab>) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => (t.id === tabId ? { ...t, ...patch } : t)),
    }))
  }, [])

  const toggleSidebar = useCallback(() => {
    setState((prev) => ({ ...prev, sidebarOpen: !prev.sidebarOpen }))
  }, [])

  // ── API Call ───────────────────────────────────────────────────────────────

  const sendRequest = useCallback(
    async (tabId: string, endpoint: ApiEndpoint) => {
      updateTab(tabId, { isLoading: true, error: undefined })

      const tab = state.tabs.find((t) => t.id === tabId)
      if (!tab) return

      const baseUrl = process.env.NEXT_PUBLIC_UAT_BASE_URL ?? ''
      const resolvedPath = endpoint.path.replace(
        /:([a-zA-Z]+)/g,
        (_, key: string) => tab.pathParamValues[key] ?? `:${key}`,
      )
      const url = `${baseUrl}${resolvedPath}`

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
      if (endpoint.requiresAuth) {
        headers['x-api-key'] = credentials.apiKey
        headers['x-api-secret'] = credentials.apiSecret
      }

      const startMs = performance.now()
      try {
        let dataPayload: any = undefined
        if (!['GET', 'DELETE'].includes(endpoint.method) || tab.requestBody.trim()) {
          const bodyStr = tab.requestBody.trim()
          if (bodyStr) {
            try {
              dataPayload = JSON.parse(bodyStr)
            } catch (parseErr) {
              throw new Error('Invalid JSON in request body')
            }
          }
        }

        const apiClient = axios.create({
          baseURL: baseUrl,
          headers,
          validateStatus: () => true, // resolve all statuses like fetch does
        })

        // Filter out empty query params
        const activeQueryParams = Object.fromEntries(
          Object.entries(tab.queryParamValues || {}).filter(([_, v]) => v !== '')
        )

        const res = await apiClient.request({
          url: resolvedPath,
          method: endpoint.method,
          data: dataPayload,
          params: activeQueryParams,
        })

        const durationMs = Math.round(performance.now() - startMs)

        const stored: StoredResponse = {
          tabId,
          endpointId: endpoint.id,
          endpointName: endpoint.name,
          status: res.status,
          statusText: res.statusText,
          data: res.data,
          durationMs,
          timestamp: new Date().toISOString(),
        }

        setState((prev) => ({
          ...prev,
          tabs: prev.tabs.map((t) =>
            t.id === tabId
              ? { ...t, isLoading: false, lastResponse: stored, error: undefined }
              : t,
          ),
          responseStore: { ...prev.responseStore, [tabId]: stored },
        }))
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error'
        updateTab(tabId, { isLoading: false, error: msg })
      }
    },
    [state.tabs, credentials, updateTab],
  )

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeTab = state.tabs.find((t) => t.id === state.activeTabId) ?? null

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[--color-surface-0]">
        <div className="w-5 h-5 rounded-full border-2 border-[--color-border-strong] border-t-[--color-brand-500] animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-[--color-surface-0] text-[--color-text-primary] overflow-hidden">

      {/* Top nav */}
      <UATHeader
        sidebarOpen={state.sidebarOpen}
        onToggleSidebar={toggleSidebar}
        apiKey={credentials.apiKey}
      />

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        {state.sidebarOpen && (
          <ApiSidebar
            catalog={catalog}
            openTabIds={state.tabs.map((t) => t.endpointId)}
            onSelect={openTab}
            onClose={toggleSidebar}
          />
        )}

        {/* Main panel */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* Tab bar */}
          <TabBar
            tabs={state.tabs}
            catalog={catalog}
            activeTabId={state.activeTabId}
            onSelect={setActiveTab}
            onClose={closeTab}
            onOpenSidebar={toggleSidebar}
          />

          {/* Tab content */}
          <div className="flex-1 overflow-auto">
            {activeTab ? (
              <ApiTabContent
                tab={activeTab}
                catalog={catalog}
                credentials={credentials}
                responseStore={state.responseStore}
                onUpdateTab={(patch) => updateTab(activeTab.id, patch)}
                onSendRequest={() => {
                  const ep = catalog.find((e) => e.id === activeTab.endpointId)
                  if (ep) sendRequest(activeTab.id, ep)
                }}
              />
            ) : (
              <EmptyState onOpenSidebar={toggleSidebar} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
