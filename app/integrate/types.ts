// ─────────────────────────────────────────────────────────────────────────────
// Integration Workbench — Types
// ─────────────────────────────────────────────────────────────────────────────

// ── Provider config ────────────────────────────────────────────────────────────
export interface ProviderConfig {
  id: string
  name: string              // "SkyDefi", "JustClick", etc.
  baseUrl: string
  authType: 'api-key' | 'bearer' | 'basic' | 'none'
  authHeaders: Record<string, string>  // key: header name, value: header value
  createdAt: string
}

// ── Flow Runner ────────────────────────────────────────────────────────────────
export type FlowStepId = 'search' | 'reprice' | 'book' | string

export interface FlowStep {
  id: FlowStepId
  label: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  urlTemplate: string         // e.g. "{{baseUrl}}/offers/{{offerId}}/price"
  headers: Array<{ key: string; value: string; enabled: boolean }>
  requestBody: string         // JSON string (editable in Monaco)
  response?: FlowStepResponse
  extractedVars?: Record<string, string>  // [DEPRECATED]
  extractions?: FlowExtraction[]
  status: 'idle' | 'loading' | 'success' | 'error'
  errorMessage?: string
}

export interface FlowStepResponse {
  status: number
  statusText: string
  data: unknown
  durationMs: number
  timestamp: string
}

export interface FlowGlobalVar {
  id: string
  key: string
  value: string
}

export interface FlowExtraction {
  id: string
  name: string
  path: string
  value?: string
}

export interface ProviderFlow {
  id: string
  providerName: string
  steps: FlowStep[]
  globalVars: FlowGlobalVar[] // Array for stable IDs
  createdAt: string
}

// ── Normalization mapper ───────────────────────────────────────────────────────
export interface NormMapping {
  fdField: string         // e.g. "airlineCode"
  jsonPath: string        // e.g. "data.slices[0].marketingCarrier.iataCode"
  transform?: string      // e.g. "extractFlightNumber(value)"
}

export interface NormSession {
  providerName: string
  providerJson: string    // raw JSON string
  mappings: NormMapping[]
}

// ── Postman import ─────────────────────────────────────────────────────────────
export interface ParsedPostmanEndpoint {
  id: string
  name: string
  method: string
  url: string
  headers: Record<string, string>
  body?: string
  description?: string
  folder?: string
}

// ── Log Explorer ──────────────────────────────────────────────────────────────
export interface BookingLogEntry {
  _id: string
  organizationId: string
  organizationProviderId?: string
  apiClientId?: string
  providerName: string
  bookingStatus?: 'PROCESSING' | 'ERROR' | 'CONFIRMED'
  bookingURL?: string
  bookingReq?: unknown
  bookingResponse?: unknown
  metaData?: unknown
  createdAt: string
  updatedAt: string
}

// ── Main workbench state ──────────────────────────────────────────────────────
export type WorkbenchTool = 'flow'

export interface WorkbenchState {
  activeTool: WorkbenchTool
  providers: ProviderConfig[]
  activeProviderId: string | null
  flows: Record<string, ProviderFlow>  // keyed by flow id
  activeFlowId: string | null
  normSession: NormSession | null
  postmanEndpoints: ParsedPostmanEndpoint[]
}

export const WORKBENCH_STORAGE_KEY = 'fdcircle_workbench_state'
export const WORKBENCH_FLOWS_KEY   = 'fdcircle_workbench_flows'
