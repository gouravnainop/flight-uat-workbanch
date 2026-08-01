import { cn } from '@/app/lib/utils'
import type { HttpMethod } from '@/app/lib/api-catalog'

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET:    'text-[--color-success]',
  POST:   'text-[--color-brand-400]',
  PUT:    'text-[--color-warning]',
  PATCH:  'text-[--color-warning]',
  DELETE: 'text-[--color-error]',
}

export const METHOD_BG: Record<HttpMethod, string> = {
  GET:    'bg-[--color-success]/10 text-[--color-success] border-[--color-success]/20',
  POST:   'bg-[--color-brand-500]/10 text-[--color-brand-300] border-[--color-brand-500]/20',
  PUT:    'bg-[--color-warning]/10 text-[--color-warning] border-[--color-warning]/20',
  PATCH:  'bg-[--color-warning]/10 text-[--color-warning] border-[--color-warning]/20',
  DELETE: 'bg-[--color-error]/10 text-[--color-error] border-[--color-error]/20',
}

interface MethodBadgeProps {
  method: HttpMethod
  className?: string
}

export function MethodBadge({ method, className }: MethodBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border',
        METHOD_BG[method],
        className,
      )}
    >
      {method}
    </span>
  )
}
