import { cva, type VariantProps } from 'class-variance-authority'
import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/app/lib/utils'
import { Loader2 } from 'lucide-react'

// ── Variants ───────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  // Base styles — applied to every variant
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium text-sm leading-none',
    'rounded-[8px] border transition-colors duration-150',
    'cursor-pointer select-none whitespace-nowrap',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand-500] focus-visible:ring-offset-2 focus-visible:ring-offset-[--color-surface-0]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-[--color-brand-500] text-white border-[--color-brand-500]',
          'hover:bg-[--color-brand-600] hover:border-[--color-brand-600]',
          'active:bg-[--color-brand-700]',
        ],
        ghost: [
          'bg-transparent text-[--color-text-secondary] border-[--color-border-default]',
          'hover:bg-[--color-surface-200] hover:text-[--color-text-primary] hover:border-[--color-border-strong]',
          'active:bg-[--color-surface-300]',
        ],
        danger: [
          'bg-transparent text-[--color-error] border-[color:rgba(248,113,113,0.2)]',
          'hover:bg-[color:rgba(248,113,113,0.08)] hover:border-[color:rgba(248,113,113,0.35)]',
        ],
        subtle: [
          'bg-[--color-surface-200] text-[--color-text-secondary] border-[--color-border-default]',
          'hover:text-[--color-text-primary] hover:border-[--color-border-strong]',
        ],
      },
      size: {
        sm: 'h-7 px-3 text-xs gap-1.5',
        md: 'h-9 px-4',
        lg: 'h-11 px-5 text-base',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Show a loading spinner and disable the button */
  isLoading?: boolean
  /** Label shown next to spinner during loading (defaults to children) */
  loadingText?: string
}

// ── Component ──────────────────────────────────────────────────────────────────

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      loadingText,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={14} aria-hidden="true" />
            {loadingText ?? children}
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonVariants }
