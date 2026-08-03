// ─────────────────────────────────────────────────────────────────────────────
// postman-parser.ts — Parse Postman Collection v2.1 JSON
// ─────────────────────────────────────────────────────────────────────────────

import type { ParsedPostmanEndpoint } from '../integrate/types'

let _counter = 0
function uid(): string {
  return `pm_${Date.now()}_${_counter++}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveUrl(raw: any): string {
  if (typeof raw === 'string') return raw
  if (raw && typeof raw === 'object') return raw.raw ?? ''
  return ''
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function walkItems(items: any[], folder: string | undefined, out: ParsedPostmanEndpoint[]) {
  for (const item of items) {
    if (Array.isArray(item.item)) {
      // folder
      walkItems(item.item, item.name ?? folder, out)
    } else if (item.request) {
      const req = item.request
      const headers: Record<string, string> = {}
      if (Array.isArray(req.header)) {
        for (const h of req.header) {
          if (!h.disabled && h.key) headers[h.key] = h.value ?? ''
        }
      }
      out.push({
        id: uid(),
        name: item.name ?? 'Unnamed',
        method: (req.method ?? 'GET').toUpperCase(),
        url: resolveUrl(req.url),
        headers,
        body: req.body?.mode === 'raw' ? (req.body.raw ?? undefined) : undefined,
        description: req.description ?? item.description ?? undefined,
        folder,
      })
    }
  }
}

export function parsePostmanCollection(jsonStr: string): ParsedPostmanEndpoint[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let col: any
  try {
    col = JSON.parse(jsonStr)
  } catch {
    throw new Error('Invalid JSON — could not parse Postman collection')
  }
  const schema: string = col?.info?.schema ?? ''
  if (!schema.includes('v2.1')) {
    throw new Error('Only Postman Collection v2.1 format is supported')
  }
  const endpoints: ParsedPostmanEndpoint[] = []
  walkItems(col.item ?? [], undefined, endpoints)
  return endpoints
}
