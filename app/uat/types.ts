/**
 * UAT Explorer — state types.
 * Kept in a separate file so they can be imported by server and client components
 * without pulling in any React runtime.
 */

// ── Stored API Response ────────────────────────────────────────────────────────

export interface StoredResponse {
  tabId: string
  endpointId: string
  endpointName: string
  status: number
  statusText: string
  data: unknown
  durationMs: number
  timestamp: string       // ISO 8601
}

// ── Tab ────────────────────────────────────────────────────────────────────────

export type SubTab = 'try' | 'curl' | 'typescript' | 'store'

export interface ApiTab {
  id: string              // unique instance ID (not the same as endpointId — same endpoint can be open twice)
  endpointId: string
  /** Editable path param values keyed by param name */
  pathParamValues: Record<string, string>
  /** Editable query param values keyed by param name */
  queryParamValues: Record<string, string>
  /** Editable request body as a JSON string */
  requestBody: string
  isLoading: boolean
  activeSubTab: SubTab
  lastResponse?: StoredResponse
  error?: string
}

// ── Explorer State ─────────────────────────────────────────────────────────────

export interface UATExplorerState {
  tabs: ApiTab[]
  activeTabId: string | null
  /** Accumulated responses from ALL tabs — keyed by tabId */
  responseStore: Record<string, StoredResponse>
  sidebarOpen: boolean
}

// ── SessionStorage key ─────────────────────────────────────────────────────────

export const STORAGE_KEY = 'fdcircle_uat_state'
export const CREDS_KEY_STORAGE = 'fdcircle_api_key'
export const CREDS_SECRET_STORAGE = 'fdcircle_api_secret'
