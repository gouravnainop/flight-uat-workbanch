'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/app/lib/utils'

interface JsonResponseViewerProps {
  data: unknown
}

function highlightText(text: string, search: string) {
  if (!search) return text
  const parts = text.toString().split(new RegExp(`(${search})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="bg-yellow-300 text-black rounded-sm px-[2px] font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

function JsonNode({ name, value, depth, search, defaultExpanded = false }: any) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  
  const isObject = value !== null && typeof value === 'object'
  const isArray = Array.isArray(value)

  const hasMatch = useMemo(() => {
    if (!search) return false
    const searchLower = search.toLowerCase()
    
    if (name && String(name).toLowerCase().includes(searchLower)) return true
    
    if (!isObject) {
      return String(value).toLowerCase().includes(searchLower)
    }
    
    try {
      return JSON.stringify(value).toLowerCase().includes(searchLower)
    } catch {
      return false
    }
  }, [search, value, name, isObject])

  const expanded = search ? hasMatch : isExpanded

  if (!hasMatch && search) {
    return null
  }

  if (!isObject) {
    let colorClass = 'text-[--color-text-secondary]'
    if (typeof value === 'string') colorClass = 'text-[--color-success] dark:text-green-400'
    else if (typeof value === 'number') colorClass = 'text-blue-600 dark:text-blue-400'
    else if (typeof value === 'boolean') colorClass = 'text-orange-600 dark:text-orange-400'
    else if (value === null) colorClass = 'text-gray-500 italic'

    return (
      <div className="flex font-mono text-xs leading-6 hover:bg-[--color-surface-100] px-1 rounded-md transition-colors" style={{ paddingLeft: `${depth * 16}px` }}>
        {name !== null && name !== undefined && (
          <span className="text-[--color-text-primary] mr-1 font-medium">
            "{highlightText(name, search)}":
          </span>
        )}
        <span className={colorClass}>
          {typeof value === 'string' ? '"' : ''}
          {highlightText(String(value), search)}
          {typeof value === 'string' ? '"' : ''}
        </span>
      </div>
    )
  }

  const keys = Object.keys(value)
  const isEmpty = keys.length === 0
  const openBracket = isArray ? '[' : '{'
  const closeBracket = isArray ? ']' : '}'

  return (
    <div className="font-mono text-xs leading-6">
      <div 
        className="flex items-center hover:bg-[--color-surface-100] px-1 rounded-md transition-colors cursor-pointer select-none"
        style={{ paddingLeft: `${Math.max(0, depth - 1) * 16}px` }}
        onClick={() => !search && setIsExpanded(!isExpanded)}
      >
        <span className="w-4 h-4 flex items-center justify-center shrink-0">
          {!isEmpty && (
            expanded ? <ChevronDown size={14} className="text-[--color-text-muted]" /> : <ChevronRight size={14} className="text-[--color-text-muted]" />
          )}
        </span>
        {name !== null && name !== undefined && (
          <span className="text-[--color-text-primary] mr-1 font-medium">
            "{highlightText(name, search)}":
          </span>
        )}
        <span className="text-[--color-text-muted]">{openBracket}</span>
        {!expanded && !isEmpty && (
          <span className="text-[--color-text-muted] px-1">...</span>
        )}
        {!expanded && !isEmpty && (
          <span className="text-[--color-text-muted]">{closeBracket}</span>
        )}
        {!expanded && !isEmpty && (
          <span className="text-[--color-text-muted] ml-2 text-[10px] bg-[--color-surface-200] px-1.5 py-0.5 rounded-full">{keys.length} items</span>
        )}
      </div>

      {expanded && !isEmpty && (
        <div>
          {keys.map((key) => (
            <JsonNode
              key={key}
              name={isArray ? null : key}
              value={value[key as keyof typeof value]}
              depth={depth + 1}
              search={search}
              defaultExpanded={defaultExpanded}
            />
          ))}
          <div 
            className="hover:bg-[--color-surface-100] px-1 rounded-md transition-colors text-[--color-text-muted]"
            style={{ paddingLeft: `${depth * 16}px` }}
          >
            {closeBracket}
          </div>
        </div>
      )}
    </div>
  )
}

export default function JsonResponseViewer({ data }: JsonResponseViewerProps) {
  const [search, setSearch] = useState('')

  const parsedData = useMemo(() => {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data)
      } catch {
        return data
      }
    }
    return data
  }, [data])

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Search Bar */}
      <div className="px-5 py-3 border-b border-[--color-border-subtle] bg-[--color-surface-50] shrink-0 sticky top-0 z-10">
        <div className="relative w-full">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--color-text-muted]" />
          <input
            type="text"
            placeholder="Search in response..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-[--color-border-default] bg-[--color-surface-0] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand-500] focus:ring-1 focus:ring-[--color-brand-500]/20 transition-colors shadow-sm"
          />
        </div>
      </div>
      
      {/* Tree */}
      <div className="flex-1 overflow-auto px-5 py-4 bg-[--color-surface-0]">
        {typeof parsedData === 'object' && parsedData !== null ? (
          <JsonNode value={parsedData} depth={1} search={search} defaultExpanded={true} />
        ) : (
          <pre className="text-xs font-mono text-[--color-text-secondary] whitespace-pre-wrap wrap-break-word">
            {highlightText(String(parsedData), search)}
          </pre>
        )}
      </div>
    </div>
  )
}
