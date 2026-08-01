'use client'

import { useState, useCallback, useMemo } from 'react'
import * as yup from 'yup'
import { Send, AlertCircle, CheckCircle2, Clock, Lightbulb, ShieldCheck } from 'lucide-react'
import { Button } from '@/app/components/ui'
import JsonResponseViewer from './JsonResponseViewer'
import JsonEditor from './JsonEditor'
import ParamInput from './ParamInput'
import validationSchemas from '@/app/lib/validation-schemas'
import { yupToJsonSchema } from '@/app/lib/yup-json-schema'
import { cn } from '@/app/lib/utils'
import type { ApiTab } from '../../types'
import type { ApiEndpoint } from '@/app/lib/api-catalog'

interface TryItTabProps {
  tab: ApiTab
  endpoint: ApiEndpoint
  onUpdateTab: (patch: Partial<ApiTab>) => void
  onSendRequest: () => void
}

export default function TryItTab({ tab, endpoint, onUpdateTab, onSendRequest }: TryItTabProps) {
  const [viewMode, setViewMode] = useState<'raw' | 'tree'>('tree')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isBodyValid, setIsBodyValid] = useState<boolean | null>(null)

  const validationSchema = validationSchemas[endpoint.id] ?? null
  const bodyJsonSchema = useMemo(
    () => (validationSchema ? yupToJsonSchema(validationSchema) : null),
    [validationSchema],
  )
  const hasPathParams = (endpoint.pathParams?.length ?? 0) > 0
  const response = tab.lastResponse

  const validateBody = useCallback(async (body: string) => {
    if (!validationSchema || !body.trim()) {
      setValidationErrors([])
      setIsBodyValid(null)
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      setValidationErrors(['Invalid JSON — cannot parse request body'])
      setIsBodyValid(false)
      return
    }
    try {
      await validationSchema.validate(parsed, { abortEarly: false })
      setValidationErrors([])
      setIsBodyValid(true)
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setValidationErrors(err.inner.length > 0 ? err.inner.map((e) => e.message) : [err.message])
      }
      setIsBodyValid(false)
    }
  }, [validationSchema])

  const statusColor = response
    ? response.status >= 200 && response.status < 300
      ? 'text-[--color-success]'
      : response.status >= 400
        ? 'text-[--color-error]'
        : 'text-[--color-warning]'
    : ''

  return (
    <div className="grid lg:grid-cols-2 gap-0 h-full divide-x divide-[--color-border-subtle]">

      {/* ── Left: Request ── */}
      <div className="flex flex-col overflow-auto">
        <div className="px-5 py-4 space-y-4">

          {/* Path params */}
          {hasPathParams && (
            <section>
              <h3 className="text-xs font-semibold text-[--color-text-secondary] mb-2 uppercase tracking-wider">
                Path Parameters
              </h3>
              <div className="space-y-2">
                {endpoint.pathParams!.map((param) => (
                  <div key={param.name} className="flex items-center gap-3">
                    <code className="text-xs font-mono text-[--color-text-muted] w-24 shrink-0">
                      :{param.name}
                    </code>
                    <input
                      type="text"
                      value={tab.pathParamValues[param.name] ?? ''}
                      onChange={(e) =>
                        onUpdateTab({
                          pathParamValues: {
                            ...tab.pathParamValues,
                            [param.name]: e.target.value,
                          },
                        })
                      }
                      placeholder={param.example}
                      className="flex-1 h-7 px-2.5 text-xs font-mono rounded-md border border-[--color-border-default] bg-[--color-surface-50] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand-500] transition-colors"
                    />
                    <span className="text-[10px] text-[--color-text-muted] hidden sm:block max-w-40 truncate">
                      {param.description}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Query params */}
          {(endpoint.queryParams?.length ?? 0) > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-[--color-text-secondary] mb-2 uppercase tracking-wider">
                Query Parameters
              </h3>
              <div className="space-y-2">
                {endpoint.queryParams!.map((param) => (
                  <div key={param.name} className="flex items-center gap-3">
                    <code className="text-xs font-mono text-[--color-text-muted] w-24 shrink-0 mr-4">
                      {param.name}
                      {param.required && <span className="text-[--color-error] ml-1">*</span>}
                    </code>
                    <ParamInput
                      param={param}
                      value={tab.queryParamValues?.[param.name] ?? ''}
                      onChange={(val) =>
                        onUpdateTab({
                          queryParamValues: {
                            ...tab.queryParamValues,
                            [param.name]: val,
                          },
                        })
                      }
                    />
                    <span className="text-[10px] text-[--color-text-muted] hidden sm:block max-w-40 truncate">
                      {param.description}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Request body */}
          {endpoint.method !== 'GET' && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider">
                  Request Body
                  <span className="ml-2 text-[10px] normal-case font-normal text-[--color-text-muted]">JSON</span>
                </h3>
                {/* Validation badge */}
                { isBodyValid !== null && (
                  <span className={cn(
                    'flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full',
                    isBodyValid
                      ? 'text-[--color-success] bg-[--color-success]/10 border border-[--color-success]/20'
                      : 'text-[--color-error] bg-[--color-error]/10 border border-[--color-error]/20'
                  )}>
                    {isBodyValid
                      ? <><ShieldCheck size={10} /> Valid</>
                      : <><AlertCircle size={10} /> {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}</>
                    }
                  </span>
                )}
              </div>
              <JsonEditor
                path={`${endpoint.id}-request-body.json`}
                value={tab.requestBody}
                onChange={(val) => {
                  onUpdateTab({ requestBody: val })
                  validateBody(val)
                }}
                schema={bodyJsonSchema}
                isValid={isBodyValid}
              />

              {/* Validation errors panel */}
              {validationErrors.length > 0 && (
                <div className="mt-2 rounded-lg border border-[--color-error]/25 bg-[--color-error]/[0.04] overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-[--color-error]/15 bg-[--color-error]/[0.06]">
                    <AlertCircle size={12} className="text-[--color-error] shrink-0" />
                    <span className="text-[10px] font-semibold text-[--color-error] uppercase tracking-wider">
                      Validation Errors
                    </span>
                    <span className="ml-auto text-[10px] text-[--color-error]/60 font-mono">
                      {validationErrors.length} issue{validationErrors.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <ul className="divide-y divide-[--color-error]/10">
                    {validationErrors.map((msg, i) => (
                      <li key={i} className="flex items-start gap-2 px-3 py-1.5">
                        <span className="text-[--color-error]/40 font-mono text-[10px] mt-px shrink-0 select-none">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="text-xs text-[--color-error]/80 font-mono leading-relaxed">
                          {msg}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          {/* Network / runtime error */}
          {tab.error && (
            <div className="flex items-start gap-2 text-xs text-[--color-error] bg-[--color-error]/[0.07] border border-[--color-error]/20 rounded-lg px-3 py-2.5">
              <AlertCircle size={13} className="mt-px shrink-0" />
              {tab.error}
            </div>
          )}

          <Button
            onClick={onSendRequest}
            isLoading={tab.isLoading}
            loadingText="Sending…"
            size="sm"
            className="w-full sm:w-auto"
          >
            <Send size={13} />
            Send Request
          </Button>
          <div className='gap-x-2 gap-y-2 flex flex-col'>
            {endpoint.notes && (
              endpoint.notes.map((note, index) => (
                <p key={index} className="text-xs text-[--color-text-muted] bg-[--color-surface-200] rounded-lg leading-relaxed flex items-center gap-x-2">
                  <Lightbulb color="#d4ff38" size={14} /> {note}
                </p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Response ── */}
      <div className="flex flex-col overflow-auto">
        {response ? (
          <>
            {/* Response status bar */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[--color-border-subtle] bg-[--color-surface-50] shrink-0">
              <span className={cn('flex items-center gap-1.5 text-xs font-semibold', statusColor)}>
                {response.status >= 200 && response.status < 300
                  ? <CheckCircle2 size={13} />
                  : <AlertCircle size={13} />
                }
                {response.status} {response.statusText}
              </span>
              <span className="flex items-center gap-1 text-xs text-[--color-text-muted]">
                <Clock size={11} />
                {response.durationMs}ms
              </span>
              <span className="text-[10px] text-[--color-text-muted] ml-auto">
                {new Date(response.timestamp).toLocaleTimeString()}
              </span>

              {/* View Toggle */}
              <div className="flex bg-[--color-surface-200] rounded-md p-0.5 ml-2">
                <button
                  onClick={() => setViewMode('raw')}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer",
                    viewMode === 'raw'
                      ? "bg-[--color-surface-0] shadow-sm text-[--color-text-primary]"
                      : "text-[--color-text-muted] hover:text-[--color-text-secondary]"
                  )}
                >
                  Raw
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] font-medium transition-colors cursor-pointer",
                    viewMode === 'tree'
                      ? "bg-[--color-surface-0] shadow-sm text-[--color-text-primary]"
                      : "text-[--color-text-muted] hover:text-[--color-text-secondary]"
                  )}
                >
                  Tree
                </button>
              </div>
            </div>

            {/* Response body */}
            {viewMode === 'raw' ? (
              <pre className="flex-1 overflow-auto px-5 py-4 text-xs font-mono text-[--color-text-secondary] leading-relaxed whitespace-pre-wrap wrap-break-word">
                {typeof response.data === 'string'
                  ? response.data
                  : JSON.stringify(response.data, null, 2)
                }
              </pre>
            ) : (
              <JsonResponseViewer data={response.data} />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center px-8">
            <div className="w-10 h-10 rounded-xl bg-[--color-surface-200] border border-[--color-border-default] flex items-center justify-center">
              <Send size={16} className="text-[--color-text-muted]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[--color-text-secondary]">No response yet</p>
              <p className="text-xs text-[--color-text-muted] mt-1">Send a request to see the response here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
