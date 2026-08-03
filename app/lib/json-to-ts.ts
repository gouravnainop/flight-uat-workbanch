// ─────────────────────────────────────────────────────────────────────────────
// json-to-ts.ts — Convert a JSON value to TypeScript interface declarations
// ─────────────────────────────────────────────────────────────────────────────

function pascalCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase())
}

interface IfaceField {
  name: string
  type: string
}

interface Iface {
  name: string
  fields: IfaceField[]
}

function inferType(
  value: unknown,
  key: string,
  allOptional: boolean,
  interfaces: Map<string, Iface>,
): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    const elemType = inferType(value[0], `${key}Item`, allOptional, interfaces)
    return `${elemType}[]`
  }
  if (typeof value === 'object') {
    const name = pascalCase(key)
    buildIface(value as Record<string, unknown>, name, allOptional, interfaces)
    return name
  }
  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'string') return 'string'
  return 'unknown'
}

function buildIface(
  obj: Record<string, unknown>,
  name: string,
  allOptional: boolean,
  interfaces: Map<string, Iface>,
) {
  if (interfaces.has(name)) return
  const fields: IfaceField[] = Object.entries(obj).map(([k, v]) => ({
    name: k,
    type: inferType(v, pascalCase(k), allOptional, interfaces),
  }))
  interfaces.set(name, { name, fields })
}

export function jsonToTs(json: unknown, rootName = 'Root', allOptional = true): string {
  const interfaces = new Map<string, Iface>()

  if (json !== null && typeof json === 'object' && !Array.isArray(json)) {
    buildIface(json as Record<string, unknown>, rootName, allOptional, interfaces)
  } else if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object' && json[0] !== null) {
    buildIface(json[0] as Record<string, unknown>, rootName, allOptional, interfaces)
  } else {
    return `export type ${rootName} = ${typeof json}\n`
  }

  // Emit non-root interfaces first, then root last
  const names = [...interfaces.keys()]
  const ordered = [...names.filter((n) => n !== rootName), rootName]

  return ordered
    .map((name) => {
      const iface = interfaces.get(name)!
      const fields = iface.fields
        .map((f) => {
          const opt = allOptional ? '?' : ''
          return `  ${f.name}${opt}: ${f.type};`
        })
        .join('\n')
      return `export interface ${name} {\n${fields}\n}`
    })
    .join('\n\n')
}
