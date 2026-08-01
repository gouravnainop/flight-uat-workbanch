'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { ApiTab } from '../../types'
import type { ApiEndpoint } from '@/app/lib/api-catalog'

interface CurlTabProps {
  tab: ApiTab
  endpoint: ApiEndpoint
  credentials: { apiKey: string; apiSecret: string }
}

export default function CurlTab({ tab, endpoint, credentials }: CurlTabProps) {
  const baseUrl = process.env.NEXT_PUBLIC_UAT_BASE_URL ?? 'https://uat.your-provider.com/api/v1'
  const resolvedPath = endpoint.path.replace(
    /:([a-zA-Z]+)/g,
    (_, key: string) => tab.pathParamValues[key] ?? `:${key}`,
  )
  let url = `${baseUrl}${resolvedPath}`
  const queryParams = new URLSearchParams()
  Object.entries(tab.queryParamValues || {}).forEach(([k, v]) => {
    if (v !== '') queryParams.append(k, v)
  })
  const queryString = queryParams.toString()
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString
  }

  const lines: string[] = [`curl -X ${endpoint.method} \\`, `  '${url}' \\`]

  if (endpoint.requiresAuth) {
    lines.push(`  -H 'x-api-key: ${credentials.apiKey || '<your-api-key>'}' \\`)
    lines.push(`  -H 'x-api-secret: ${credentials.apiSecret || '<your-api-secret>'}' \\`)
  }
  lines.push(`  -H 'Content-Type: application/json' \\`)
  lines.push(`  -H 'Accept: application/json'`)

  if (endpoint.method !== 'GET' && tab.requestBody.trim()) {
    try {
      // Compact it for cURL
      const compact = JSON.stringify(JSON.parse(tab.requestBody))
      lines[lines.length - 1] += ' \\'
      lines.push(`  -d '${compact}'`)
    } catch {
      lines[lines.length - 1] += ' \\'
      lines.push(`  -d '${tab.requestBody.trim()}'`)
    }
  }

  const curlCommand = lines.join('\n')

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-[--color-text-secondary] uppercase tracking-wider">
          cURL Command
        </h3>
        <CopyButton text={curlCommand} />
      </div>

      <pre className="text-xs font-mono text-[--color-text-secondary] bg-[--color-surface-0] border border-[--color-border-default] rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre">
        {curlCommand}
      </pre>

      <div className="text-xs text-[--color-text-muted] space-y-1">
        <p>• The cURL above uses your current credentials and request body.</p>
        <p>• Edit path parameters or request body in the <strong className="text-[--color-text-secondary]">Try it</strong> tab — this view updates automatically.</p>
        {!credentials.apiKey && (
          <p className="text-[--color-warning]">⚠ No credentials found in session — re-authorize from the home page.</p>
        )}
      </div>
    </div>
  )
}

// ── Copy button ────────────────────────────────────────────────────────────────

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
      className="flex items-center gap-1.5 cursor-pointer text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors"
    >
      {copied ? <Check size={12} className="text-[--color-success]" /> : <Copy size={12} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}
