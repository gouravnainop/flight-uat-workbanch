'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { ApiEndpoint } from '@/app/lib/api-catalog'

interface TypeScriptTabProps {
  endpoint: ApiEndpoint
}

export default function TypeScriptTab({ endpoint }: TypeScriptTabProps) {
  return (
    <div className="p-5 space-y-6">

      {/* Request body */}
      {endpoint.requestBodyType && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider">
              Request Body
            </h3>
            <CopyButton text={endpoint.requestBodyType} />
          </div>
          <CodeBlock code={endpoint.requestBodyType} />
        </section>
      )}

      {/* Response body */}
      {endpoint.responseBodyType && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider">
              Response Body
            </h3>
            <CopyButton text={endpoint.responseBodyType} />
          </div>
          <CodeBlock code={endpoint.responseBodyType} />
        </section>
      )}

      {/* Path params */}
      {(endpoint.pathParams?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider">
            Path Parameters
          </h3>
          <table className="w-full text-xs border border-[--color-border-default] rounded-lg overflow-hidden">
            <thead className="bg-[--color-surface-200]">
              <tr>
                {['Name', 'Type', 'Description', 'Example'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-[--color-text-muted] text-[10px] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border-subtle]">
              {endpoint.pathParams!.map((p) => (
                <tr key={p.name} className="bg-[--color-surface-0]">
                  <td className="px-3 py-2 font-mono text-[--color-brand-300]">:{p.name}</td>
                  <td className="px-3 py-2 font-mono text-[--color-text-muted]">{p.type}</td>
                  <td className="px-3 py-2 text-[--color-text-secondary]">{p.description}</td>
                  <td className="px-3 py-2 font-mono text-[--color-text-muted]">{p.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Query params */}
      {(endpoint.queryParams?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider">
            Query Parameters
          </h3>
          <table className="w-full text-xs border border-[--color-border-default] rounded-lg overflow-hidden">
            <thead className="bg-[--color-surface-200]">
              <tr>
                {['Name', 'Type', 'Required', 'Description'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-[--color-text-muted] text-[10px] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[--color-border-subtle]">
              {endpoint.queryParams!.map((p) => (
                <tr key={p.name} className="bg-[--color-surface-0]">
                  <td className="px-3 py-2 font-mono text-[--color-brand-300]">{p.name}</td>
                  <td className="px-3 py-2 font-mono text-[--color-text-muted]">{p.type}</td>
                  <td className="px-3 py-2">
                    <span className={p.required ? 'text-[--color-error]' : 'text-[--color-text-muted]'}>
                      {p.required ? 'Required' : 'Optional'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[--color-text-secondary]">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!endpoint.requestBodyType && !endpoint.responseBodyType && (
        <p className="text-sm text-[--color-text-muted]">No TypeScript schemas defined for this endpoint yet.</p>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  // Very simple syntax highlighting via CSS
  return (
    <pre className="text-xs font-mono text-[--color-text-secondary] bg-[--color-surface-0] border border-[--color-border-default] rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre">
      <TypescriptHighlight code={code} />
    </pre>
  )
}

function TypescriptHighlight({ code }: { code: string }) {
  // Minimal keyword coloring using spans
  const highlighted = code
    .replace(/\b(interface|type|extends|string|number|boolean|object|unknown|undefined|null|enum)\b/g,
      '<span style="color:var(--color-brand-300)">$1</span>')
    .replace(/\b(export)\b/g,
      '<span style="color:#C586C0">$1</span>')
    .replace(/\b(true|false)\b/g, '<span style="color:var(--color-warning)">$1</span>')
    .replace(/(\/\/[^\n]*)/g, '<span style="color:var(--color-text-muted)">$1</span>')
    .replace(/(&#39;[^&#39;]*&#39;|&quot;[^&quot;]*&quot;)/g, '<span style="color:var(--color-success)">$1</span>')

  return <code dangerouslySetInnerHTML={{ __html: highlighted }} />
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors cursor-pointer"
    >
      {copied ? <Check size={12} className="text-[--color-success]" /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
