'use client'

import { useState, useCallback, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Plus, Trash2, Play, ChevronDown, ChevronRight, Variable, Check, Copy, GitBranch, FileCode2, Braces, Sun, Moon, X } from 'lucide-react'
import { cn } from '@/app/lib/utils'
import JSZip from 'jszip'
import { jsonToTs } from '@/app/lib/json-to-ts'

import { MethodBadge } from '@/app/uat/components/MethodBadge'
import type { ProviderConfig, ProviderFlow, FlowStep, FlowStepResponse, FlowGlobalVar } from '@/app/integrate/types'

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

const MONACO_OPTIONS = {
  fontSize: 12, fontFamily: 'JetBrains Mono, monospace', lineHeight: 20,
  minimap: { enabled: false }, scrollBeyondLastLine: false, wordWrap: 'on' as const,
  padding: { top: 8, bottom: 8 }, overviewRulerBorder: false,
  scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
}

function getJsonPaths(obj: unknown, prefix = '', depth = 0): string[] {
  if (depth > 6 || obj == null || typeof obj !== 'object') return []
  const paths: string[] = []
  
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      const newPrefix = `${prefix}[0]`
      paths.push(newPrefix)
      paths.push(...getJsonPaths(obj[0], newPrefix, depth + 1))
    }
  } else {
    for (const [key, value] of Object.entries(obj)) {
      const newPrefix = prefix ? `${prefix}.${key}` : key
      paths.push(newPrefix)
      paths.push(...getJsonPaths(value, newPrefix, depth + 1))
    }
  }
  return paths
}

function evalPath(obj: unknown, path: string): string {
  try {
    if (!path || obj == null) return ''
    const cleanPath = path.trim()
    if (!cleanPath) return ''

    // Normalize bracket syntax: results[0][1].key -> results.0.1.key
    const normalized = cleanPath.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '')
    const segments = normalized.split('.').filter(Boolean)

    let current: any = obj
    for (const segment of segments) {
      if (current == null) return ''
      current = current[segment]
    }

    if (current === undefined) return ''
    if (typeof current === 'object' && current !== null) return JSON.stringify(current)
    return String(current)
  } catch {
    return ''
  }
}

function resolveVars(template: string, vars: FlowGlobalVar[]): string {
  const map = Object.fromEntries(vars.map(v => [v.key.toLowerCase(), v.value]))
  return template.replace(/\{\{([^}]+)\}\}/g, (match, name) => map[name.trim().toLowerCase()] ?? match)
}

function parseCurl(curl: string): Partial<FlowStep> | null {
  const trimmed = curl.trim()
  if (!trimmed.toLowerCase().startsWith('curl ')) return null

  let method = 'GET'
  const methodMatch = trimmed.match(/-X\s+([A-Z]+)/i)
  if (methodMatch) {
    method = methodMatch[1].toUpperCase()
  } else if (trimmed.includes('-d ') || trimmed.includes('--data') || trimmed.includes('--data-raw')) {
    method = 'POST'
  }

  const headers: { key: string, value: string, enabled: boolean }[] = []
  const headerRegex = /(?:-H|--header)\s+['"]?([^:'"]+):\s*([^'"]+)['"]?/g
  let hMatch
  while ((hMatch = headerRegex.exec(trimmed)) !== null) {
    headers.push({ key: hMatch[1].trim(), value: hMatch[2].trim(), enabled: true })
  }

  let requestBody = ''
  const bodyRegex = /(?:-d|--data|--data-raw|--data-binary)\s+(?:'([^']*)'|"([^"]*)")/i
  const bMatch = trimmed.match(bodyRegex)
  if (bMatch) {
    requestBody = bMatch[1] || bMatch[2] || ''
  }

  const urlRegex = /['"]?(https?:\/\/[^\s'"]+)['"]?/
  const urlMatch = trimmed.match(urlRegex)
  const urlTemplate = urlMatch ? urlMatch[1] : ''

  return { method: method as any, urlTemplate, headers, requestBody }
}

function nanoid(n = 8) {
  return Math.random().toString(36).slice(2, 2 + n)
}

function makeStep(partial?: Partial<FlowStep>): FlowStep {
  return {
    id: nanoid(),
    label: 'New Step',
    method: 'GET',
    urlTemplate: '',
    headers: [],
    requestBody: '',
    extractedVars: {},
    status: 'idle',
    ...partial,
  }
}

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const

function CopyButton({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="flex items-center gap-1 px-2 py-1 ml-2 text-[10px] rounded bg-[--color-surface-200] text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors cursor-pointer font-medium"
    >
      {copied ? <Check size={10} className="text-[--color-success]" /> : <Copy size={10} />}
      {copied ? 'Copied!' : 'Copy JSON'}
    </button>
  )
}

// ── Inline variable extraction form ─────────────────────────────────────────────
function ExtractVarForm({
  responseData,
  availablePaths = [],
  onSave,
  onCancel,
}: {
  responseData: unknown
  availablePaths?: string[]
  onSave: (name: string, path: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [path, setPath] = useState('')

  // Live preview of the extracted value
  const evaluatedValue = useMemo(() => {
    return evalPath(responseData, path)
  }, [responseData, path])

  // Filter available paths matching current path
  const matchingSuggestions = useMemo(() => {
    if (!path.trim()) return availablePaths.slice(0, 6)
    const lower = path.toLowerCase()
    return availablePaths
      .filter((p) => p.toLowerCase().includes(lower) && p.toLowerCase() !== lower)
      .slice(0, 6)
  }, [availablePaths, path])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Enter' && name.trim() && path.trim()) {
      e.preventDefault()
      onSave(name.trim(), path.trim())
    }
  }

  return (
    <div className="my-2 p-3 rounded-lg border border-[--color-brand-500]/30 bg-[--color-surface-100] shadow-sm space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[--color-text-primary]">
          <Variable size={13} className="text-[--color-brand-400]" />
          <span>Extract Variable into Flow</span>
        </div>
        <button
          onClick={onCancel}
          type="button"
          className="p-1 rounded text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-[--color-surface-200] transition-colors cursor-pointer"
        >
          <X size={12} />
        </button>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Variable Name */}
        <div>
          <label className="block text-[10px] font-medium text-[--color-text-muted] mb-1">
            Variable Name
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-2 text-[10px] font-mono text-[--color-brand-400] font-semibold select-none">
              {`{{`}
            </span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.replace(/[{}\s]/g, ''))}
              onKeyDown={handleKeyDown}
              placeholder="e.g. flightId"
              className="w-full h-7 pl-6 pr-6 text-xs font-mono rounded border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand-500] transition-colors"
            />
            <span className="absolute right-2 text-[10px] font-mono text-[--color-brand-400] font-semibold select-none">
              {`}}`}
            </span>
          </div>
        </div>

        {/* JSON Path */}
        <div>
          <label className="block text-[10px] font-medium text-[--color-text-muted] mb-1">
            JSON Response Path
          </label>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value.trim())}
            onKeyDown={handleKeyDown}
            placeholder="e.g. results[0][0].resultSessionId"
            className="w-full h-7 px-2.5 text-xs font-mono rounded border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand-500] transition-colors"
          />
        </div>
      </div>

      {/* Quick Suggestions */}
      {matchingSuggestions.length > 0 && (
        <div className="space-y-1">
          <span className="text-[9px] text-[--color-text-muted] uppercase tracking-wider font-semibold">
            Suggested paths:
          </span>
          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
            {matchingSuggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onClick={() => setPath(sug)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[--color-surface-0] hover:bg-[--color-brand-500]/15 hover:text-[--color-brand-400] border border-[--color-border-subtle] text-[--color-text-secondary] transition-colors cursor-pointer truncate max-w-[220px]"
                title={sug}
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Value Preview */}
      {path.trim() && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[--color-surface-0] border border-[--color-border-subtle] text-[10px] font-mono">
          <span className="text-[--color-text-muted] shrink-0">Extracted value:</span>
          {evaluatedValue ? (
            <span className="text-[--color-success] font-semibold truncate" title={evaluatedValue}>
              {evaluatedValue}
            </span>
          ) : (
            <span className="text-[--color-text-muted] italic">undefined (no match found in response)</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[--color-border-subtle]">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-2.5 py-1 rounded bg-[--color-surface-200] text-[--color-text-muted] hover:text-[--color-text-primary] hover:bg-[--color-surface-300] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            if (name.trim() && path.trim()) onSave(name.trim(), path.trim())
          }}
          disabled={!name.trim() || !path.trim()}
          className="flex items-center gap-1.5 text-xs px-3 py-1 rounded bg-[--color-brand-500] text-white hover:bg-[--color-brand-600] disabled:opacity-40 transition-colors cursor-pointer font-medium"
        >
          <Check size={12} />
          Save Extraction
        </button>
      </div>
    </div>
  )
}

// ── Step card ──────────────────────────────────────────────────────────────────
function StepCard({
  step, index, globalVars, isActive, editorTheme,
  onUpdate, onDelete, onRun, onAddExtraction, onRemoveExtraction, onClick,
}: {
  step: FlowStep; index: number; globalVars: FlowGlobalVar[]; isActive: boolean; editorTheme: 'vs-dark' | 'light'
  onUpdate: (patch: Partial<FlowStep>) => void
  onDelete: () => void
  onRun: () => void
  onAddExtraction: (name: string, path: string) => void
  onRemoveExtraction: (id: string) => void
  onClick: () => void
}) {
  const [open, setOpen] = useState(true)
  const [showExtract, setShowExtract] = useState(false)

  const resolvedUrl = resolveVars(step.urlTemplate, globalVars)

  const availablePaths = useMemo(() => {
    if (!step.response?.data) return []
    try {
      // Traverse up to depth 6 to extract paths
      return getJsonPaths(step.response.data)
    } catch {
      return []
    }
  }, [step.response?.data])

  return (
    <div className={cn('border rounded-lg overflow-hidden transition-colors', isActive ? 'border-[--color-brand-500]/40' : 'border-[--color-border-default]')}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-[--color-surface-100]" onClick={onClick}>
        <button onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }} className="cursor-pointer text-[--color-text-muted]">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
        <span className="text-[10px] font-mono text-[--color-text-muted] w-4 shrink-0">{index + 1}</span>
        <MethodBadge method={step.method} />
        <input
          value={step.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-xs font-medium bg-transparent text-[--color-text-primary] focus:outline-none min-w-0"
        />
        {step.status === 'loading' && <span className="w-3 h-3 rounded-full border-2 border-t-[--color-brand-500] animate-spin shrink-0" />}
        {step.status === 'success' && <Check size={12} className="text-[--color-success] shrink-0" />}
        <button onClick={(e) => { e.stopPropagation(); onRun() }}
          className="shrink-0 p-1 rounded bg-[--color-brand-500]/10 text-[--color-brand-400] hover:bg-[--color-brand-500]/20 transition-colors cursor-pointer">
          <Play size={12} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="shrink-0 p-1 rounded text-[--color-text-muted] hover:text-[--color-error] hover:bg-[--color-error]/10 transition-colors cursor-pointer">
          <Trash2 size={12} />
        </button>
      </div>

      {open && (
        <div className="px-3 py-3 space-y-2.5 bg-[--color-surface-50]">
          {/* Method + URL */}
          <div className="flex gap-2">
            <select
              value={step.method}
              onChange={(e) => onUpdate({ method: e.target.value as FlowStep['method'] })}
              className="h-7 px-2 text-xs rounded-md border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] focus:outline-none focus:border-[--color-brand-500] transition-colors cursor-pointer"
            >
              {METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
            <input
              value={step.urlTemplate}
              onChange={(e) => onUpdate({ urlTemplate: e.target.value })}
              onPaste={(e) => {
                const text = e.clipboardData.getData('Text')
                const parsed = parseCurl(text)
                if (parsed) {
                  e.preventDefault()
                  onUpdate(parsed)
                }
              }}
              placeholder="{{baseUrl}}/search (or paste cURL here)"
              className="flex-1 h-7 px-2.5 text-xs font-mono rounded-md border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand-500] transition-colors"
            />
          </div>
          {resolvedUrl !== step.urlTemplate && (
            <p className="text-[10px] font-mono text-[--color-text-muted] truncate">→ {resolvedUrl}</p>
          )}

          {/* Headers */}
          {step.headers.length > 0 && (
            <div className="space-y-1">
              {step.headers.map((h, hi) => (
                <div key={hi} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={h.enabled} onChange={(e) => {
                    const hs = [...step.headers]; hs[hi] = { ...h, enabled: e.target.checked }; onUpdate({ headers: hs })
                  }} className="accent-[--color-brand-500]" />
                  <input value={h.key} onChange={(e) => { const hs = [...step.headers]; hs[hi] = { ...h, key: e.target.value }; onUpdate({ headers: hs }) }}
                    placeholder="Header" className="flex-1 h-6 px-2 text-[10px] font-mono rounded border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] focus:outline-none focus:border-[--color-brand-500] transition-colors" />
                  <input value={h.value} onChange={(e) => { const hs = [...step.headers]; hs[hi] = { ...h, value: e.target.value }; onUpdate({ headers: hs }) }}
                    placeholder="Value" className="flex-1 h-6 px-2 text-[10px] font-mono rounded border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] focus:outline-none focus:border-[--color-brand-500] transition-colors" />
                  <button onClick={() => { const hs = step.headers.filter((_, i) => i !== hi); onUpdate({ headers: hs }) }}
                    className="text-[--color-text-muted] hover:text-[--color-error] cursor-pointer"><Trash2 size={11} /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => onUpdate({ headers: [...step.headers, { key: '', value: '', enabled: true }] })}
            className="flex items-center gap-1 text-[10px] text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors cursor-pointer">
            <Plus size={10} /> Add header
          </button>

          {/* Body (for non-GET) */}
          {step.method !== 'GET' && (
            <div className="border border-[--color-border-default] rounded-md overflow-hidden">
              <Editor height="120px" language="json" value={step.requestBody} onChange={(v) => onUpdate({ requestBody: v ?? '' })} theme={editorTheme} options={MONACO_OPTIONS} />
            </div>
          )}

          {/* Extract vars */}
          {step.status === 'success' && step.response && (
            <div className="mt-3 pt-2.5 border-t border-[--color-border-subtle]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Variable size={12} className="text-[--color-brand-400]" />
                  <span className="text-[10px] text-[--color-text-muted] font-semibold uppercase tracking-wider">
                    Extractions {step.extractions?.length ? `(${step.extractions.length})` : ''}
                  </span>
                </div>
                {!showExtract && (
                  <button
                    onClick={() => setShowExtract(true)}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[--color-surface-200] text-[--color-text-secondary] hover:bg-[--color-brand-500]/10 hover:text-[--color-brand-400] cursor-pointer transition-colors font-medium"
                  >
                    <Plus size={10} /> Add Extraction
                  </button>
                )}
              </div>

              {/* Inline form when adding */}
              {showExtract && (
                <ExtractVarForm
                  responseData={step.response.data}
                  availablePaths={availablePaths}
                  onSave={(name, path) => {
                    setShowExtract(false)
                    onAddExtraction(name, path)
                  }}
                  onCancel={() => setShowExtract(false)}
                />
              )}

              {/* List of existing extractions */}
              {step.extractions && step.extractions.length > 0 ? (
                <div className="space-y-1.5">
                  {step.extractions.map((ext) => (
                    <div
                      key={ext.id}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[--color-surface-0] border border-[--color-border-subtle] text-[11px] font-mono group"
                    >
                      <span
                        className="px-1.5 py-0.5 rounded bg-[--color-brand-500]/10 text-[--color-brand-400] font-semibold shrink-0"
                        title={`Variable: {{${ext.name}}}`}
                      >
                        {`{{${ext.name}}}`}
                      </span>
                      <span className="text-[--color-text-muted] shrink-0">=</span>
                      <span
                        className="text-[--color-text-secondary] truncate flex-1 text-[10px]"
                        title={`JSON Path: ${ext.path}`}
                      >
                        {ext.path}
                      </span>
                      {ext.value && (
                        <span
                          className="text-[--color-success] text-[10px] truncate max-w-[130px] text-right font-medium shrink-0"
                          title={`Value: ${ext.value}`}
                        >
                          → {ext.value}
                        </span>
                      )}
                      <button
                        onClick={() => onRemoveExtraction(ext.id)}
                        title="Delete extraction"
                        className="p-1 rounded text-[--color-text-muted] hover:text-[--color-error] hover:bg-[--color-error]/10 transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                !showExtract && (
                  <p className="text-[10px] text-[--color-text-muted] italic">
                    No variables extracted yet. Click &quot;Add Extraction&quot; to pass response values into next steps.
                  </p>
                )
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────────────────────
interface Props {
  provider: ProviderConfig | null
  flows: Record<string, ProviderFlow>
  onUpdateFlows: (flows: Record<string, ProviderFlow>) => void
}

function defaultFlow(providerName: string): ProviderFlow {
  return {
    id: nanoid(),
    providerName,
    steps: [makeStep({ label: 'Search', method: 'GET' }), makeStep({ label: 'Reprice', method: 'GET' }), makeStep({ label: 'Book', method: 'POST' })],
    globalVars: [{ id: nanoid(), key: 'baseUrl', value: '' }, { id: nanoid(), key: 'apiKey', value: '' }],
    createdAt: new Date().toISOString(),
  }
}

export default function FlowRunner({ provider, flows, onUpdateFlows }: Props) {
  const flowId = provider ? (Object.keys(flows).find((id) => flows[id].providerName === provider.name) ?? null) : null
  const [activeFlowId, setActiveFlowId] = useState<string | null>(flowId)
  const flow = activeFlowId ? flows[activeFlowId] : null

  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [isFlowRunning, setIsFlowRunning] = useState(false)
  const [viewMode, setViewMode] = useState<'json' | 'ts'>('json')
  const [tsRootName, setTsRootName] = useState('Root')
  const [tsAllOptional, setTsAllOptional] = useState(true)
  const [editorTheme, setEditorTheme] = useState<'vs-dark' | 'light'>('vs-dark')

  const activeResponse = useMemo(() => flow?.steps.find((s) => s.id === activeStepId)?.response ?? null, [flow?.steps, activeStepId])

  const createFlow = () => {
    const f = defaultFlow(provider?.name ?? 'New Provider')
    onUpdateFlows({ ...flows, [f.id]: f })
    setActiveFlowId(f.id)
  }

  const updateFlow = useCallback((patch: Partial<ProviderFlow>) => {
    if (!activeFlowId) return
    onUpdateFlows({ ...flows, [activeFlowId]: { ...flows[activeFlowId], ...patch } })
  }, [activeFlowId, flows, onUpdateFlows])

  const updateStep = (stepId: string, patch: Partial<FlowStep>) => {
    if (!flow) return
    updateFlow({ steps: flow.steps.map((s) => s.id === stepId ? { ...s, ...patch } : s) })
  }

  const runStep = async (stepId: string) => {
    if (!flow) return
    const step = flow.steps.find((s) => s.id === stepId)
    if (!step) return
    updateStep(stepId, { status: 'loading', errorMessage: undefined })
    const url = resolveVars(step.urlTemplate, safeGlobalVars)
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    step.headers.filter((h) => h.enabled && h.key).forEach((h) => { headers[h.key] = resolveVars(h.value, safeGlobalVars) })
    const resolvedBody = step.requestBody.trim() ? resolveVars(step.requestBody, safeGlobalVars) : undefined
    
    const startMs = performance.now()
    try {
      const res = await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, method: step.method, headers, body: resolvedBody }),
      })
      const json = await res.json()
      const durationMs = Math.round(performance.now() - startMs)

      const newExtractions = (step.extractions || []).map(ext => ({
        ...ext,
        value: evalPath(json.data ?? json, ext.path)
      }))

      const stepResponse: FlowStepResponse = {
        status: json.status ?? res.status,
        statusText: json.statusText ?? '',
        data: json.data,
        durationMs,
        timestamp: new Date().toISOString(),
      }
      
      const newGlobalVars = Array.isArray(flow.globalVars) ? [...flow.globalVars] : []
      newExtractions.forEach(ext => {
        if (ext.value) {
          const existing = newGlobalVars.find(v => v.key === ext.name)
          if (existing) existing.value = ext.value
          else newGlobalVars.push({ id: nanoid(), key: ext.name, value: ext.value })
        }
      })

      updateFlow({ 
        globalVars: newGlobalVars,
        steps: flow.steps.map(s => s.id === stepId ? { ...s, status: 'success', response: stepResponse, extractions: newExtractions } : s)
      })
      setActiveStepId(stepId)
    } catch (e: unknown) {
      updateStep(stepId, { status: 'error', errorMessage: (e as Error).message })
    }
  }

  const runFullFlowAndDownload = async () => {
    if (!flow || isFlowRunning) return
    setIsFlowRunning(true)
    
    const zip = new JSZip()
    const safeGlobalVars: FlowGlobalVar[] = Array.isArray(flow.globalVars)
      ? flow.globalVars
      : Object.entries(flow.globalVars || {}).map(([k, v]) => ({ id: nanoid(), key: k, value: typeof v === 'string' ? v : '' }))
    
    let currentGlobalVars = [...safeGlobalVars]
    const newSteps = [...flow.steps]
    
    for (let i = 0; i < newSteps.length; i++) {
      const step = newSteps[i]
      newSteps[i] = { ...step, status: 'loading', errorMessage: undefined }
      updateFlow({ steps: newSteps }) // UI feedback
      setActiveStepId(step.id)
      
      const url = resolveVars(step.urlTemplate, currentGlobalVars)
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      step.headers.filter((h) => h.enabled && h.key).forEach((h) => { headers[h.key] = resolveVars(h.value, currentGlobalVars) })
      const resolvedBody = step.requestBody.trim() ? resolveVars(step.requestBody, currentGlobalVars) : undefined
      
      const curlHeaders = Object.entries(headers).map(([k, v]) => `-H '${k}: ${v}'`).join(' ')
      const curlBody = resolvedBody ? `-d '${resolvedBody}'` : ''
      const curl = `curl -X ${step.method} '${url}' ${curlHeaders} ${curlBody}`.trim()
      
      const startMs = performance.now()
      try {
        const res = await fetch('/api/proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, method: step.method, headers, body: resolvedBody }),
        })
        const json = await res.json()
        const durationMs = Math.round(performance.now() - startMs)
        
        const newExtractions = (step.extractions || []).map(ext => ({
          ...ext,
          value: evalPath(json.data ?? json, ext.path)
        }))

        const stepResponse: FlowStepResponse = {
          status: json.status ?? res.status,
          statusText: json.statusText ?? '',
          data: json.data,
          durationMs,
          timestamp: new Date().toISOString(),
        }
        
        newExtractions.forEach(ext => {
          if (ext.value) {
            const existing = currentGlobalVars.find(v => v.key === ext.name)
            if (existing) existing.value = ext.value
            else currentGlobalVars.push({ id: nanoid(), key: ext.name, value: ext.value })
          }
        })
        
        newSteps[i] = { ...newSteps[i], status: 'success', response: stepResponse, extractions: newExtractions }
        
        let reqBodyObj = {}
        if (resolvedBody) {
          try { reqBodyObj = JSON.parse(resolvedBody) } catch { reqBodyObj = { raw: resolvedBody } }
        }
        
        const logEntry = {
          URL: url,
          METHOD: step.method,
          CURL: curl,
          REQUEST_BODY: reqBodyObj,
          RESPONSE: json.data
        }
        
        zip.file(`${i + 1}_${step.label.replace(/\s+/g, '_')}.json`, JSON.stringify(logEntry, null, 2))
        
      } catch (e: unknown) {
        newSteps[i] = { ...newSteps[i], status: 'error', errorMessage: (e as Error).message }
        break
      }
    }
    
    updateFlow({ globalVars: currentGlobalVars, steps: newSteps })
    setIsFlowRunning(false)
    
    if (Object.keys(zip.files).length > 0) {
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      a.download = `flow_${flow.providerName.replace(/\s+/g, '_')}_${timestamp}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  if (!flow) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
        <div className="w-12 h-12 rounded-xl bg-[--color-surface-200] border border-[--color-border-default] flex items-center justify-center">
          <GitBranch size={20} className="text-[--color-text-muted]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[--color-text-secondary]">No flow yet</p>
          <p className="text-xs text-[--color-text-muted] mt-1">Create a new flow to start building your integration</p>
        </div>
        <button onClick={createFlow}
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-md bg-[--color-brand-500] text-white hover:bg-[--color-brand-600] transition-colors cursor-pointer font-medium">
          <Plus size={13} /> New Flow
        </button>
      </div>
    )
  }

  const safeGlobalVars: FlowGlobalVar[] = Array.isArray(flow.globalVars)
    ? flow.globalVars
    : Object.entries(flow.globalVars || {}).map(([k, v]) => ({ id: nanoid(), key: k, value: typeof v === 'string' ? v : '' }))

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — Steps (40%) */}
      <div className="w-[40%] flex flex-col overflow-hidden border-r border-[--color-border-subtle]">
        {/* Global vars */}
        <div className="px-4 py-3 border-b border-[--color-border-subtle] bg-[--color-surface-50] shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Variable size={13} className="text-[--color-text-muted]" />
            <span className="text-xs font-semibold text-[--color-text-secondary]">Global Variables</span>
            <button onClick={() => updateFlow({ globalVars: [...safeGlobalVars, { id: nanoid(), key: '', value: '' }] })}
              className="ml-auto flex items-center gap-1 text-[10px] text-[--color-text-muted] hover:text-[--color-text-secondary] cursor-pointer transition-colors">
              <Plus size={10} /> Add
            </button>
          </div>
          <div className="space-y-1">
            {safeGlobalVars.map((gv, i) => (
              <div key={gv.id} className="flex items-center gap-1.5">
                <input value={gv.key} onChange={(e) => {
                  const vars = [...safeGlobalVars]; vars[i] = { ...gv, key: e.target.value }; updateFlow({ globalVars: vars })
                }} placeholder="key" className="w-24 h-6 px-2 text-[10px] font-mono rounded border border-[--color-border-default] bg-[--color-surface-0] text-[--color-brand-300] focus:outline-none focus:border-[--color-brand-500] transition-colors" />
                <input value={gv.value} onChange={(e) => {
                  const vars = [...safeGlobalVars]; vars[i] = { ...gv, value: e.target.value }; updateFlow({ globalVars: vars })
                }} placeholder="value" className="flex-1 h-6 px-2 text-[10px] font-mono rounded border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] focus:outline-none focus:border-[--color-brand-500] transition-colors" />
                <button onClick={() => {
                  updateFlow({ globalVars: safeGlobalVars.filter(v => v.id !== gv.id) })
                }} className="text-[--color-text-muted] hover:text-[--color-error] cursor-pointer"><Trash2 size={11} /></button>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {flow.steps.map((step, idx) => (
            <StepCard
              key={step.id}
              step={step}
              index={idx}
              globalVars={safeGlobalVars}
              isActive={activeStepId === step.id}
              editorTheme={editorTheme}
              onUpdate={(patch) => updateStep(step.id, patch)}
              onDelete={() => updateFlow({ steps: flow.steps.filter((s) => s.id !== step.id) })}
              onRun={() => runStep(step.id)}
              onAddExtraction={(name, path) => {
                const extValue = step.response?.data ? evalPath(step.response.data, path) : ''
                const newExt = { id: nanoid(), name, path, value: extValue }
                const newExtractions = [...(step.extractions || []), newExt]
                
                const newGlobalVars = [...safeGlobalVars]
                if (extValue) {
                  const existing = newGlobalVars.find(v => v.key === name)
                  if (existing) existing.value = extValue
                  else newGlobalVars.push({ id: nanoid(), key: name, value: extValue })
                }
                
                updateFlow({
                  globalVars: newGlobalVars,
                  steps: flow.steps.map((s) => s.id === step.id ? { ...s, extractions: newExtractions } : s)
                })
              }}
              onRemoveExtraction={(id) => {
                updateStep(step.id, { extractions: (step.extractions || []).filter(e => e.id !== id) })
              }}
              onClick={() => setActiveStepId(step.id)}
            />
          ))}
          <button onClick={() => updateFlow({ steps: [...flow.steps, makeStep()] })}
            className="flex items-center gap-2 w-full text-xs px-3 py-2 rounded-lg border border-dashed border-[--color-border-default] text-[--color-text-muted] hover:border-[--color-brand-500]/40 hover:text-[--color-text-secondary] transition-colors cursor-pointer">
            <Plus size={12} /> Add Step
          </button>
        </div>
      </div>

      {/* Right — Response (60%) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Timeline */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[--color-border-subtle] bg-[--color-surface-50] shrink-0 overflow-x-auto">
          {flow.steps.map((step, idx) => (
            <button key={step.id} onClick={() => { setActiveStepId(step.id) }}
              className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 font-medium',
                activeStepId === step.id ? 'bg-[--color-brand-500]/10 text-[--color-brand-400]' : 'text-[--color-text-muted] hover:text-[--color-text-secondary]'
              )}>
              <span className={cn('w-1.5 h-1.5 rounded-full',
                step.status === 'success' ? 'bg-[--color-success]' :
                step.status === 'error' ? 'bg-[--color-error]' :
                step.status === 'loading' ? 'bg-[--color-warning] animate-pulse' :
                'bg-[--color-text-muted]'
              )} />
              {idx + 1}. {step.label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setEditorTheme(t => t === 'vs-dark' ? 'light' : 'vs-dark')}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-[--color-surface-200] transition-colors cursor-pointer shrink-0"
            title="Toggle Editor Theme"
          >
            {editorTheme === 'vs-dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button 
             onClick={runFullFlowAndDownload}
             disabled={isFlowRunning}
             className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[--color-brand-500] text-white hover:bg-[--color-brand-600] transition-colors cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
          >
             {isFlowRunning ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Play size={12}/>}
             <span className="font-medium whitespace-nowrap">Run Full Flow & Export Logs</span>
          </button>
        </div>

        {activeResponse ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[--color-border-subtle] bg-[--color-surface-50] shrink-0">
              <span className={cn('text-xs font-semibold',
                activeResponse.status >= 200 && activeResponse.status < 300 ? 'text-[--color-success]' : 'text-[--color-error]'
              )}>{activeResponse.status} {activeResponse.statusText}</span>
              <span className="text-xs text-[--color-text-muted]">{activeResponse.durationMs}ms</span>
              <span className="text-[10px] text-[--color-text-muted] ml-auto">{new Date(activeResponse.timestamp).toLocaleTimeString()}</span>
              
              <div className="flex bg-[--color-surface-200] rounded p-0.5 ml-2">
                <button
                  onClick={() => setViewMode('json')}
                  className={cn('flex items-center gap-1.5 px-2 py-1 text-[10px] rounded font-medium transition-colors cursor-pointer', viewMode === 'json' ? 'bg-[--color-surface-0] text-[--color-text-primary] shadow-sm' : 'text-[--color-text-muted] hover:text-[--color-text-secondary]')}
                >
                  <Braces size={11} /> JSON
                </button>
                <button
                  onClick={() => setViewMode('ts')}
                  className={cn('flex items-center gap-1.5 px-2 py-1 text-[10px] rounded font-medium transition-colors cursor-pointer', viewMode === 'ts' ? 'bg-[--color-surface-0] text-[--color-text-primary] shadow-sm' : 'text-[--color-text-muted] hover:text-[--color-text-secondary]')}
                >
                  <FileCode2 size={11} /> TypeScript
                </button>
              </div>

              <CopyButton data={activeResponse.data} />
            </div>
            
            {viewMode === 'ts' && (
              <div className="flex items-center gap-3 px-4 py-2 border-b border-[--color-border-subtle] bg-[--color-surface-0] shrink-0">
                <label className="flex items-center gap-2 text-[10px] font-medium text-[--color-text-secondary]">
                  Root Interface:
                  <input
                    value={tsRootName}
                    onChange={(e) => setTsRootName(e.target.value)}
                    className="h-6 px-2 w-32 font-mono rounded border border-[--color-border-default] bg-[--color-surface-50] text-[--color-text-primary] focus:outline-none focus:border-[--color-brand-500] transition-colors"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-[10px] font-medium text-[--color-text-secondary] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tsAllOptional}
                    onChange={(e) => setTsAllOptional(e.target.checked)}
                    className="accent-[--color-brand-500]"
                  />
                  All properties optional
                </label>
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              {viewMode === 'json' ? (
                <Editor
                  height="100%"
                  language="json"
                  theme={editorTheme}
                  value={typeof activeResponse.data === 'object' ? JSON.stringify(activeResponse.data, null, 2) : String(activeResponse.data || '')}
                  options={{ ...MONACO_OPTIONS, readOnly: true, wordWrap: 'off' }}
                />
              ) : (
                <Editor
                  height="100%"
                  language="typescript"
                  theme={editorTheme}
                  value={(() => {
                    try {
                      return jsonToTs(activeResponse.data, tsRootName || 'Root', tsAllOptional)
                    } catch {
                      return '// Error generating TypeScript'
                    }
                  })()}
                  options={{ ...MONACO_OPTIONS, readOnly: true, wordWrap: 'off' }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-8">
            <Play size={24} className="text-[--color-text-muted]" />
            <p className="text-xs text-[--color-text-muted]">Run a step to see the response here</p>
          </div>
        )}
      </div>
    </div>
  )
}
