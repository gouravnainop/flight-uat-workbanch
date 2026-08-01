import { type HTMLAttributes } from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/app/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

type AlertVariant = 'error' | 'success' | 'info' | 'warning'

const alertConfig: Record<
  AlertVariant,
  { icon: React.ComponentType<{ size?: number; className?: string }>; className: string }
> = {
  error: {
    icon: AlertCircle,
    className:
      'bg-[--color-error]/[0.07] border-[--color-error]/20 text-[--color-error]',
  },
  success: {
    icon: CheckCircle2,
    className:
      'bg-[--color-success]/[0.07] border-[--color-success]/20 text-[--color-success]',
  },
  info: {
    icon: Info,
    className:
      'bg-[--color-info]/[0.07] border-[--color-info]/20 text-[--color-info]',
  },
  warning: {
    icon: AlertTriangle,
    className:
      'bg-[--color-warning]/[0.07] border-[--color-warning]/20 text-[--color-warning]',
  },
}

// ── Props ──────────────────────────────────────────────────────────────────────

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant
  /** Hide the icon */
  noIcon?: boolean
}

// ── Component ──────────────────────────────────────────────────────────────────

function Alert({
  className,
  variant = 'info',
  noIcon = false,
  children,
  ...props
}: AlertProps) {
  const { icon: Icon, className: variantClass } = alertConfig[variant]

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm',
        variantClass,
        className,
      )}
      {...props}
    >
      {!noIcon && (
        <Icon size={15} className="mt-px shrink-0" aria-hidden="true" />
      )}
      <span className="leading-relaxed">{children}</span>
    </div>
  )
}

export { Alert }
