import { type InputHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/app/lib/utils'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

// ── Component ──────────────────────────────────────────────────────────────────

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[--color-text-secondary] tracking-[0.01em]"
          >
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          aria-invalid={error ? true : undefined}
          className={cn(
            // Base
            'h-9 w-full rounded-[8px] border px-3 text-sm',
            'bg-[--color-surface-50] text-[--color-text-primary]',
            'placeholder:text-[--color-text-muted]',
            'transition-colors duration-150',
            // Default border
            'border-[--color-border-default]',
            // Focus
            'focus:outline-none focus:border-[--color-brand-500] focus:ring-1 focus:ring-[--color-brand-500]/30',
            // Error state
            error && 'border-[--color-error]/50 focus:border-[--color-error] focus:ring-[--color-error]/20',
            // Disabled
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Mono font for API keys
            props.type === 'text' && props.autoComplete === 'off' && 'font-mono',
            className,
          )}
          {...props}
        />

        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-[--color-error]"
          >
            {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[--color-text-muted]">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'

export { Input }
