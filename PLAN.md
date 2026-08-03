# FDCircle Integration Workbench — Build Instructions for Cursor

> **Project location**: `C:\Users\itsch\Desktop\Tools\fdcircleuat`
> **Framework**: Next.js 16 (App Router), React 19, Tailwind v4, TypeScript
> **Design system**: existing `globals.css` CSS variables (`--color-*`)

---

## What to build

A new top-level route `/integrate` added to this Next.js app, alongside the existing `/uat` route.
It is an **Integration Workbench** — a developer tool for integrating external flight booking APIs
(e.g. SkyDefi, JustClick, TravelPort) into the FDCircle platform.

The workbench has **5 tools**, each accessible via a horizontal tab bar at the top.

---

## Context: How external API integration works in FDCircle

External flight APIs are integrated in the Node.js backend. Each provider service file
(e.g. `skydefi.service.ts`) exposes:
- `searchFlight()` → POST to provider, return normalized `NormalizedFlight[]`
- `repriceFlight()` → re-check price before booking
- `processBooking()` → POST booking, update `OutsourceBookingLogger`

The `NormalizedFlight` interface is the standard FDCircle internal format all providers must map to.
The tool should help a developer integrate a new provider by:
1. Converting provider JSON responses to TypeScript interfaces
2. Running the Search → Reprice → Book flow against the real provider API
3. Visually mapping provider JSON fields to `NormalizedFlight` fields
4. Importing the provider's Postman collection
5. Browsing booking logs

---

## Existing app patterns to follow

- **Reuse** `app/components/ui` → `Button`, `Badge`
- **Reuse** `app/uat/components/subtabs/JsonResponseViewer.tsx` for JSON tree rendering
- **Reuse** `app/uat/components/subtabs/JsonEditor.tsx` for Monaco JSON editors
- **Reuse** `app/uat/components/subtabs/CurlTab.tsx` → `CopyButton` pattern
- **Reuse** CSS variables from `globals.css` — never hardcode hex colors
- **Follow** the same sidebar + tab layout as `UATExplorer.tsx`
- **Credential storage**: `sessionStorage` for ephemeral, `localStorage` for persistent

---

## Dependencies to install first

```bash
npm install jszip
npm install @types/jszip --save-dev
```

Everything else (`@monaco-editor/react`, `nanoid`, `axios`, `lucide-react`) is already installed.

---

## Build order — follow exactly

### Phase 1 — Foundation files

#### 1. `app/integrate/types.ts`
All TypeScript types for the workbench state.

```typescript
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
  extractedVars: Record<string, string>  // vars extracted from response
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

export interface ProviderFlow {
  id: string
  providerName: string
  steps: FlowStep[]
  globalVars: Record<string, string>  // {{baseUrl}}, {{apiKey}}, etc.
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
export type WorkbenchTool = 'json' | 'flow' | 'mapper' | 'import' | 'logs'

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
```

---

#### 2. `app/lib/json-to-ts.ts`
Pure function that takes a JSON value and returns TypeScript interface declarations.

Implementation rules:
- Entry: `export function jsonToTs(json: unknown, rootName = 'Root'): string`
- Recurse into objects: for each key, call `inferType(value, pascalCase(key))`
- Arrays: infer element type from first element (or `unknown[]` if empty)
- Null values: type is `unknown | null`
- Collect all generated interfaces, return them joined by `\n\n`
- Root interface is always last
- Deduplicate identical interfaces by content hash (optional, can skip)
- Make all fields optional by default (append `?`)

Example output:
```typescript
export interface MarketingCarrier {
  iataCode?: string;
  name?: string;
}

export interface Slice {
  origin?: string;
  destination?: string;
  marketingCarrier?: MarketingCarrier;
}

export interface Root {
  data?: Slice[];
}
```

---

#### 3. `app/lib/postman-parser.ts`
Parse Postman Collection v2.1 JSON format.

```typescript
import type { ParsedPostmanEndpoint } from '../integrate/types'

export function parsePostmanCollection(jsonStr: string): ParsedPostmanEndpoint[]
```

Algorithm:
- `JSON.parse(jsonStr)`
- Check `info.schema` contains `v2.1`
- Recursively walk `item[]`. If `item.item` exists, it's a folder (recurse, pass `item.name` as folder)
- For each request item:
  - `name`: `item.name`
  - `method`: `item.request.method`
  - `url`: resolve `item.request.url` (can be string or object with `.raw`)
  - `headers`: reduce `item.request.header[]` → `{key: value}`
  - `body`: `item.request.body?.raw` (if mode is raw)
  - `description`: `item.request.description` or `item.description`

---

#### 4. `app/lib/normalization-template.ts`
Contains the FDCircle `NormalizedFlight` field registry and a code generator.

```typescript
export interface NormalizedFieldDef {
  key: string
  type: 'string' | 'number' | 'boolean' | 'object'
  desc: string
  example?: string
}

export const NORMALIZED_FLIGHT_FIELDS: NormalizedFieldDef[] = [
  { key: 'flightNumber',              type: 'string',  desc: 'Airline flight number e.g. "6E 123"',      example: '"6E 123"' },
  { key: 'airlineCode',               type: 'string',  desc: 'IATA airline code e.g. "6E"',              example: '"6E"' },
  { key: 'airlineName',               type: 'string',  desc: 'Full airline name',                         example: '"IndiGo"' },
  { key: 'sourceCode',                type: 'string',  desc: 'Origin IATA code',                          example: '"DEL"' },
  { key: 'destinationCode',           type: 'string',  desc: 'Destination IATA code',                     example: '"BOM"' },
  { key: 'sourceCity',                type: 'string',  desc: 'Origin city name',                          example: '"Delhi"' },
  { key: 'destinationCity',           type: 'string',  desc: 'Destination city name',                     example: '"Mumbai"' },
  { key: 'originTerminal',            type: 'string',  desc: 'Departure terminal',                        example: '"T3"' },
  { key: 'destinationTerminal',       type: 'string',  desc: 'Arrival terminal',                          example: '"T1"' },
  { key: 'departureTime',             type: 'string',  desc: 'HH:mm (24h) departure time',               example: '"06:30"' },
  { key: 'arrivalTime',               type: 'string',  desc: 'HH:mm (24h) arrival time',                 example: '"09:00"' },
  { key: 'onwardDate',                type: 'string',  desc: 'YYYY-MM-DD departure date',                 example: '"2025-08-15"' },
  { key: 'arrivalDate',               type: 'string',  desc: 'YYYY-MM-DD arrival date',                   example: '"2025-08-15"' },
  { key: 'sellingFare',               type: 'number',  desc: 'Per-adult base selling fare',               example: '3500' },
  { key: 'totalAmount',               type: 'number',  desc: 'Total fare for all pax',                    example: '7000' },
  { key: 'totalPayablePrice',         type: 'number',  desc: 'Final payable price (with margin)',          example: '7200' },
  { key: 'basicAmount',               type: 'number',  desc: 'Base fare before taxes',                    example: '2800' },
  { key: 'airportTaxAmount',          type: 'number',  desc: 'Per-adult airport tax',                     example: '700' },
  { key: 'infantCharges',             type: 'number',  desc: 'Per-infant total charge',                   example: '500' },
  { key: 'availableSeats',            type: 'number',  desc: 'Seats available',                           example: '9' },
  { key: 'cabinBaggageWeightAdult',   type: 'string',  desc: 'Cabin baggage e.g. "7KG"',                  example: '"7KG"' },
  { key: 'checkInBaggageWeightAdult', type: 'string',  desc: 'Check-in baggage e.g. "20KG"',              example: '"20KG"' },
  { key: 'productClass',              type: 'string',  desc: 'Fare product class / cabin',                example: '"Economy"' },
  { key: 'fareId',                    type: 'string',  desc: 'Provider fare/offer type',                  example: '"one_way"' },
  { key: 'searchKey',                 type: 'string',  desc: 'Provider offer/search ID',                  example: '"off_abc123"' },
  { key: 'flightKey',                 type: 'string',  desc: 'Provider quote/offer token',                example: '"tok_xyz789"' },
  { key: 'providerId',                type: 'string',  desc: 'OrganizationAllowedOutsourceApi._id',       example: '"6654..."' },
  { key: 'totalMarginAmount',         type: 'number',  desc: 'Total margin added to fare',                example: '200' },
  { key: 'perPaxMargin',              type: 'number',  desc: 'Per-pax margin amount',                     example: '100' },
  { key: 'stopDetails',               type: 'object',  desc: '{ noOfStops, stopData[] }',                 example: '' },
  { key: 'returnFlight',              type: 'object',  desc: 'Return leg data (roundtrip only)',           example: '' },
  { key: 'fareBreakup',               type: 'object',  desc: 'Per-pax fare breakdown',                    example: '' },
]

export function generateNormalizationSnippet(mappings: Array<{ fdField: string; jsonPath: string; transform?: string }>): string {
  // Returns a TypeScript object literal for paste into buildNormalizedFlight()
}
```

---

### Phase 2 — Tool Components

All components go in `app/integrate/components/tools/`.
Use the following structure for each tool file:

```tsx
'use client'
// imports ...

interface Props {
  // specific to each tool
}

export default function ToolName(props: Props) {
  // state + logic
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* content */}
    </div>
  )
}
```

---

#### 5. `app/integrate/components/tools/JsonToolbox.tsx`

Three sub-tabs: **Format** | **JSON → TS** | **Diff**

**Format sub-tab:**
- Single Monaco editor (language: `json`, theme: `vs-dark`)
- "Format" button → `JSON.stringify(JSON.parse(value), null, 2)`
- "Minify" button → `JSON.stringify(JSON.parse(value))`
- Status bar: `✓ Valid JSON · {N} keys · {B} bytes`
- Error state: red border + error message

**JSON → TS sub-tab:**
- Left: Monaco JSON input
- Right: TypeScript output (read-only Monaco, language: `typescript`)
- "Root name" text input (default: `Root`)
- "All optional" toggle (default: on)
- "Generate" button → calls `jsonToTs()`
- Copy button on output panel

**Diff sub-tab:**
- Two Monaco editors side by side (Left / Right labels)
- "Diff" button → compute diff
- Results below as a list of changes:
  - Green rows for added keys
  - Red rows for removed keys  
  - Yellow rows for changed values
- Summary: `+N added · -M removed · ~K changed`
- "Swap" button swaps left/right content

---

#### 6. `app/integrate/components/tools/PostmanImport.tsx`

- Top: drag-and-drop zone OR paste JSON textarea
- "Parse Collection" button → calls `parsePostmanCollection()`
- Shows collection name + endpoint count
- Collapsible tree grouped by folder
- Each endpoint row:
  - Method badge (reuse `MethodBadge` from `app/uat/components/MethodBadge.tsx`)
  - Endpoint name + URL
  - Three action buttons: "Run in Flow" | "Copy cURL" | "View Body"
- "Run in Flow" → stores endpoint in session storage key `fdcircle_postman_to_flow`
  and navigates to the Flow tab (set `activeTool = 'flow'`)

---

#### 7. `app/integrate/components/tools/NormMapper.tsx`

Two-column layout:

**Left column — Provider Response:**
- Monaco JSON editor (paste provider response)
- "Load Sample" button (loads a hardcoded SkyDefi search response example)
- JSON tree viewer below the editor (reuse `JsonResponseViewer`)

**Right column — FDCircle NormalizedFlight fields:**
- List of all `NORMALIZED_FLIGHT_FIELDS` entries
- Each row: `fieldName: type · description`
- Below each field name: a text input labeled "JSONPath" where user types the path
  e.g. `data.offers[0].slices[0].marketingCarrier.iataCode`
- Small "Preview" button next to each input → evaluates the path against the pasted JSON
  and shows the resolved value inline

**Bottom panel — Generated snippet:**
- Shows the generated TypeScript object literal (reuse `TypescriptHighlight`)
- Copy button
- "Clear all mappings" button

---

#### 8. `app/integrate/components/tools/FlowRunner.tsx`

> This is the most complex component. Build it last among the tools.

Layout: Left panel (step editor, 40% width) + Right panel (response viewer, 60% width)

**Left panel — Steps:**
- Global variables section at top:
  - Key-value table: `baseUrl`, `apiKey`, plus any user-added vars
  - "Add variable" button
- Step list (vertical, reorderable is nice-to-have but not required):
  - Each step has: Method badge + URL input + "Run" button
  - Collapsible body:
    - URL field (supports `{{varName}}` interpolation)
    - Headers table (key/value/enabled checkbox rows)
    - Monaco JSON body editor
    - After success: "Extracted Variables" section with JSONPath pickers

**Variable extraction:**
- After a step succeeds, show the response JSON tree
- User can click any leaf → a modal/popover asks "Save as variable name: [____]"
- That value gets added to `globalVars` and is available in subsequent steps as `{{name}}`

**Right panel:**
- Shows the last-run step's response
- Status code badge + duration
- JSON tree (reuse `JsonResponseViewer`)
- Timeline at bottom: `Step 1 ✓ → Step 2 ✓ → Step 3 ●`

**Booking Log Preview (after Book step):**
- Collapsible panel at the bottom of the left column
- Shows what the `OutsourceBookingLog` document would look like:
  ```json
  {
    "providerName": "SkyDefi",
    "bookingStatus": "CONFIRMED",
    "bookingURL": "{{baseUrl}}/orders",
    "bookingReq": { ...step3 request body... },
    "bookingResponse": { ...step3 response... },
    "metaData": { "reference": "...", "pnr": "..." }
  }
  ```

---

#### 9. `app/integrate/components/tools/LogExplorer.tsx`

> Requires admin login session. Check for admin JWT in cookies.
> If not logged in, show a card: "Admin access required" + link to /admin/login

**Filters bar:**
- Provider name dropdown (from enum: SkyDefi, JustClick, WorldTravel, etc.)
- Status filter: PROCESSING | ERROR | CONFIRMED | All
- Date range: two date pickers (reuse `react-datepicker` + `ParamInput` style)
- "Search" button

**Results list:**
- Table rows: `_id (truncated) | providerName | status badge | createdAt | Actions`
- Click row → expand detail panel below:
  - Three tabs: Request | Response | Metadata
  - Each tab shows JSON tree (reuse `JsonResponseViewer`)
  - "Copy as cURL" button (reconstructs the HTTP call from `bookingURL` + `bookingReq`)

**Bulk ZIP download:**
- Checkbox on each row
- "Download ZIP ({N} selected)" button at top
- Uses `JSZip`:
  ```typescript
  import JSZip from 'jszip'
  const zip = new JSZip()
  for (const log of selectedLogs) {
    zip.file(`log_${log._id}_request.json`, JSON.stringify(log.bookingReq, null, 2))
    zip.file(`log_${log._id}_response.json`, JSON.stringify(log.bookingResponse, null, 2))
    zip.file(`log_${log._id}_meta.json`, JSON.stringify(log.metaData, null, 2))
  }
  zip.file('summary.json', JSON.stringify(selectedLogs.map(l => ({ id: l._id, status: l.bookingStatus, provider: l.providerName, createdAt: l.createdAt })), null, 2))
  const blob = await zip.generateAsync({ type: 'blob' })
  // download via anchor click
  ```

**Empty/error state:**
- If backend returns 404 → show: "Log API not available yet. The backend route `/api/admin/booking-logs` needs to be created."
- Use mock data toggle for demo: pre-fill with 3 fake log entries

---

### Phase 3 — Shell components

#### 10. `app/integrate/components/IntegrateHeader.tsx`

Top bar, similar to `UATHeader.tsx`.

Layout: `[Logo] [Tool tabs: JSON | Flow | Mapper | Import | Logs] [spacer] [Provider dropdown] [← Back to UAT]`

Tool tabs are horizontal pill buttons. Active tab uses `bg-[--color-brand-500]/10 text-[--color-brand-400]`.

Icons for each tool:
- JSON → `Braces`
- Flow → `GitBranch`  
- Mapper → `ArrowLeftRight`
- Import → `FolderInput`
- Logs → `ScrollText`

---

#### 11. `app/integrate/components/ProviderSidebar.tsx`

Left sidebar (collapsible, same pattern as `ApiSidebar.tsx`).

Shows list of saved `ProviderConfig` entries.
- "Add Provider" button at top → opens an inline form:
  - Name, Base URL, Auth type (dropdown), Auth headers (key-value)
  - Save → adds to `providers[]` in state
- Click a provider → sets `activeProviderId`, injects `{{baseUrl}}` and auth headers
  into Flow Runner's global vars

---

#### 12. `app/integrate/IntegrateExplorer.tsx`

Main `'use client'` orchestrator. Pattern mirrors `UATExplorer.tsx`.

```tsx
'use client'
import { useState, useEffect } from 'react'
import { WorkbenchState, WorkbenchTool, WORKBENCH_STORAGE_KEY } from './types'
import IntegrateHeader from './components/IntegrateHeader'
import ProviderSidebar from './components/ProviderSidebar'
import JsonToolbox from './components/tools/JsonToolbox'
import FlowRunner from './components/tools/FlowRunner'
import NormMapper from './components/tools/NormMapper'
import PostmanImport from './components/tools/PostmanImport'
import LogExplorer from './components/tools/LogExplorer'

function defaultState(): WorkbenchState {
  return {
    activeTool: 'json',
    providers: [],
    activeProviderId: null,
    flows: {},
    activeFlowId: null,
    normSession: null,
    postmanEndpoints: [],
  }
}

export default function IntegrateExplorer() {
  const [state, setState] = useState<WorkbenchState>(defaultState)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(WORKBENCH_STORAGE_KEY)
      if (raw) setState(JSON.parse(raw))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) {
      try { sessionStorage.setItem(WORKBENCH_STORAGE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
    }
  }, [state, hydrated])

  const setTool = (tool: WorkbenchTool) => setState(prev => ({ ...prev, activeTool: tool }))

  const activeProvider = state.providers.find(p => p.id === state.activeProviderId) ?? null

  const renderTool = () => {
    switch (state.activeTool) {
      case 'json':   return <JsonToolbox />
      case 'flow':   return <FlowRunner provider={activeProvider} flows={state.flows} onUpdateFlows={flows => setState(p => ({ ...p, flows }))} />
      case 'mapper': return <NormMapper session={state.normSession} onUpdateSession={normSession => setState(p => ({ ...p, normSession }))} />
      case 'import': return <PostmanImport endpoints={state.postmanEndpoints} onImport={postmanEndpoints => setState(p => ({ ...p, postmanEndpoints }))} onRunInFlow={() => setTool('flow')} />
      case 'logs':   return <LogExplorer />
    }
  }

  if (!hydrated) return <div className="flex h-dvh items-center justify-center bg-[--color-surface-0]"><div className="w-5 h-5 rounded-full border-2 border-t-[--color-brand-500] animate-spin" /></div>

  return (
    <div className="flex h-dvh flex-col bg-[--color-surface-0] text-[--color-text-primary] overflow-hidden">
      <IntegrateHeader activeTool={state.activeTool} onSetTool={setTool} sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(p => !p)} />
      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <ProviderSidebar
            providers={state.providers}
            activeProviderId={state.activeProviderId}
            onSelect={id => setState(p => ({ ...p, activeProviderId: id }))}
            onAdd={provider => setState(p => ({ ...p, providers: [...p.providers, provider] }))}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        <div className="flex-1 overflow-auto">
          {renderTool()}
        </div>
      </div>
    </div>
  )
}
```

---

#### 13. `app/integrate/page.tsx`

```tsx
import IntegrateExplorer from './IntegrateExplorer'

export const metadata = {
  title: 'Integration Workbench — FDCircle',
  description: 'Tools for integrating external flight booking APIs',
}

export default function IntegratePage() {
  return <IntegrateExplorer />
}
```

---

#### 14. `app/integrate/layout.tsx`

```tsx
export default function IntegrateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

---

### Phase 4 — Wire-up

#### 15. Update `app/page.tsx`
Add a second card to the hero section below the existing `ClientCredentialCard`:

```tsx
{/* Workbench card */}
<Link
  href="/integrate"
  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[--color-border-default] bg-[--color-surface-100] hover:border-[--color-brand-500]/50 transition-all group"
>
  <div className="w-8 h-8 rounded-lg bg-[--color-surface-200] flex items-center justify-center shrink-0">
    <Wrench size={15} className="text-[--color-brand-400]" />
  </div>
  <div className="text-left">
    <p className="text-xs font-semibold text-[--color-text-primary]">Integration Workbench</p>
    <p className="text-[10px] text-[--color-text-muted]">JSON tools · Flow runner · Normalization mapper</p>
  </div>
</Link>
```

Import `Wrench` from `lucide-react`.

#### 16. Update `app/uat/components/UATHeader.tsx`
Add a nav link `href="/integrate"` with a `Wrench` icon next to the existing Admin link.

---

## CSS design tokens — reference

```css
--color-surface-0        /* page background */
--color-surface-50       /* slightly elevated */
--color-surface-100      /* cards */
--color-surface-200      /* hover states, inputs */
--color-brand-400        /* icon tint */
--color-brand-500        /* active/accent */
--color-border-subtle    /* rgba(255,255,255,0.05) */
--color-border-default   /* rgba(255,255,255,0.09) */
--color-text-primary     /* #f0f0f5 */
--color-text-secondary   /* #8e8ea8 */
--color-text-muted       /* #52526a */
--color-success          /* #34d399 */
--color-warning          /* #fbbf24 */
--color-error            /* #f87171 */
```

---

## Monaco editor standard options

Use these options everywhere you render a Monaco editor:

```typescript
{
  theme: 'vs-dark',
  language: 'json',          // or 'typescript' for output panels
  fontSize: 12,
  fontFamily: 'JetBrains Mono, monospace',
  lineHeight: 20,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderWhitespace: 'none',
  wordWrap: 'on',
  padding: { top: 12, bottom: 12 },
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
}
```

---

## State persistence rules

| State                    | Storage                      | Key                              |
|--------------------------|------------------------------|----------------------------------|
| Workbench tool/providers | `sessionStorage`             | `fdcircle_workbench_state`       |
| Flow runner flows        | `sessionStorage`             | `fdcircle_workbench_flows`       |
| Normalization mappings   | `localStorage`               | `fdcircle_norm_{providerName}`   |
| Imported Postman data    | `sessionStorage`             | `fdcircle_postman_collection`    |
| JSON Toolbox content     | NOT persisted (ephemeral)    | —                                |

---

## Common gotchas

1. **Monaco editor** needs `import dynamic from 'next/dynamic'` with `ssr: false` in Next.js App Router pages. Use:
   ```tsx
   const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false })
   ```

2. **JSZip** download pattern:
   ```typescript
   const blob = await zip.generateAsync({ type: 'blob' })
   const url = URL.createObjectURL(blob)
   const a = document.createElement('a')
   a.href = url
   a.download = 'booking-logs.zip'
   a.click()
   URL.revokeObjectURL(url)
   ```

3. **Variable interpolation** in Flow Runner URLs:
   ```typescript
   function resolveVars(template: string, vars: Record<string, string>): string {
     return template.replace(/\{\{(\w+)\}\}/g, (_, name) => vars[name] ?? `{{${name}}}`)
   }
   ```

4. **JSONPath evaluation** (no external lib needed):
   ```typescript
   function evalPath(obj: unknown, path: string): unknown {
     return path.split('.').reduce((acc, part) => {
       if (acc == null) return undefined
       const arrMatch = part.match(/^(\w+)\[(\d+)\]$/)
       if (arrMatch) return (acc as any)[arrMatch[1]]?.[Number(arrMatch[2])]
       return (acc as any)[part]
     }, obj)
   }
   ```

---

## Verification checklist

- [ ] `/integrate` route loads without errors
- [ ] Tool tabs switch correctly
- [ ] JSON Formatter prettifies pasted JSON
- [ ] JSON → TS generator produces valid TypeScript from a SkyDefi search response
- [ ] JSON Diff shows correct added/removed/changed items
- [ ] Postman collection JSON parses and shows endpoint list
- [ ] Flow Runner can fire a real HTTP request (against any test URL) and show the response
- [ ] Variable extraction works: click a response key → saves as `{{varName}}` → appears in next step URL
- [ ] Normalization mapper shows all `NormalizedFlight` fields with JSONPath inputs
- [ ] Generated snippet copies correctly
- [ ] Log Explorer shows empty state with helpful message if no backend available
- [ ] ZIP download works with mock log data
- [ ] Home page shows Integration Workbench card linking to `/integrate`
- [ ] No TypeScript errors (`npx tsc --noEmit`)
