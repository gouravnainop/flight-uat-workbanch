import { cva, type VariantProps } from 'class-variance-authority'
import { type HTMLAttributes } from 'react'
import { cn } from '@/app/lib/utils'

// ── Variants ───────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
  {
    variants: {
      variant: {
        default: 'bg-[--color-surface-300] text-[--color-text-secondary] border-[--color-border-default]',
        brand:   'bg-[--color-brand-500]/10 text-[--color-brand-300] border-[--color-brand-500]/20',
        success: 'bg-[--color-success]/10 text-[--color-success] border-[--color-success]/20',
        warning: 'bg-[--color-warning]/10 text-[--color-warning] border-[--color-warning]/20',
        error:   'bg-[--color-error]/10 text-[--color-error] border-[--color-error]/20',
        info:    'bg-[--color-info]/10 text-[--color-info] border-[--color-info]/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

// ── Component ──────────────────────────────────────────────────────────────────

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
