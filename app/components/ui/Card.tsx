import { type HTMLAttributes } from 'react'
import { cn } from '@/app/lib/utils'

// ── Card ───────────────────────────────────────────────────────────────────────

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Slightly elevated look with stronger border */
  elevated?: boolean
}

function Card({ className, elevated = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border',
        elevated
          ? 'bg-[--color-surface-200] border-[--color-border-strong]'
          : 'bg-[--color-surface-100] border-[--color-border-default]',
        className,
      )}
      {...props}
    />
  )
}

// ── Card Sub-components ────────────────────────────────────────────────────────

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1 px-5 pt-5', className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-sm font-semibold text-[--color-text-primary] tracking-tight',
        className,
      )}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-[--color-text-muted]', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center px-5 pb-5 border-t border-[--color-border-subtle] pt-4 mt-1',
        className,
      )}
      {...props}
    />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
