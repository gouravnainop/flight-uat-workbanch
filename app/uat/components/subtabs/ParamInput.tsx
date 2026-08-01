'use client'

import { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import moment from 'moment'
import { ChevronDown, Calendar, CalendarDays } from 'lucide-react'
import type { QueryParam } from '@/app/lib/api-catalog'

import 'react-datepicker/dist/react-datepicker.css'

interface ParamInputProps {
  param: QueryParam
  value: string
  onChange: (value: string) => void
}

// ── Enum Dropdown ────────────────────────────────────────────────────────────

function EnumSelect({ param, value, onChange }: ParamInputProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const enums = param.enums ?? []
  const displayValue = value || param.example || ''

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between h-7 px-2.5 text-xs font-mono rounded-md border border-[--color-border-default] bg-[--color-surface-50] text-left cursor-pointer transition-colors focus:outline-none focus:border-[--color-brand-500] hover:border-[--color-border-strong]"
      >
        <span className={value ? 'text-[--color-text-primary]' : 'text-[--color-text-muted]'}>
          {displayValue || 'Select...'}
        </span>
        <ChevronDown
          size={12}
          className={`text-[--color-text-muted] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-md border border-[--color-border-default] bg-[--color-surface-0] shadow-lg overflow-hidden">
          {/* Clear option */}
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className="w-full px-3 py-1.5 text-left text-xs text-[--color-text-muted] hover:bg-[--color-surface-100] transition-colors italic"
          >
            — clear —
          </button>
          {enums.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`w-full px-3 py-1.5 text-left text-xs font-mono transition-colors hover:bg-[--color-brand-500]/10 ${
                value === opt
                  ? 'text-[--color-brand-400] bg-[--color-brand-500]/5'
                  : 'text-[--color-text-secondary]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Custom Date Picker ───────────────────────────────────────────────────────

function DateSelect({ param, value, onChange }: ParamInputProps) {
  const selected = value ? moment(value, 'YYYY-MM-DD').toDate() : null

  return (
    <div className="relative flex-1 [&_.react-datepicker-wrapper]:w-full">
      <div className="relative">
        <CalendarDays
          size={18}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[--color-text-muted] pointer-events-none z-10"
        />
        <DatePicker
          selected={selected}
          onChange={(date: Date | null) => {
            if (date) {
              onChange(moment(date).format('YYYY-MM-DD'))
            } else {
              onChange('')
            }
          }}
          dateFormat="yyyy-MM-dd"
          placeholderText={param.example ?? 'YYYY-MM-DD'}
          className="w-full h-7 pl-8 pr-2.5 text-xs font-mono rounded-md border border-[--color-border-default] bg-[--color-surface-50] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand-500] transition-colors"
          calendarClassName="!font-sans !text-xs !rounded-lg !border !border-[--color-border-default] !shadow-lg !bg-[--color-surface-0]"
          showPopperArrow={false}
          isClearable
          todayButton={'Select Today'}
        />
      </div>
    </div>
  )
}

// ── Main exported component ──────────────────────────────────────────────────

export default function ParamInput({ param, value, onChange }: ParamInputProps) {
  if (param.type === 'enum') {
    return <EnumSelect param={param} value={value} onChange={onChange} />
  }

  if (param.type === 'date') {
    return <DateSelect param={param} value={value} onChange={onChange} />
  }

  return (
    <input
      type={param.type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={param.example}
      className="flex-1 h-7 px-2.5 text-xs font-mono rounded-md border border-[--color-border-default] bg-[--color-surface-50] text-[--color-text-primary] placeholder:text-[--color-text-muted] focus:outline-none focus:border-[--color-brand-500] transition-colors"
    />
  )
}
