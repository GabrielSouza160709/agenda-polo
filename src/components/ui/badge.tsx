import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-muted text-foreground',
        outline: 'border-border bg-card text-foreground',
        destructive:
          'border-transparent bg-[var(--error-subtle)] text-[var(--error-text)]',
        success:
          'border-transparent bg-[var(--success-subtle)] text-[var(--success-text)]',
        privacy:
          'border-transparent bg-[var(--info-subtle)] text-[var(--info-text)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) {
  return (
    <div className={cn(badgeVariants({ variant, className }))} {...props} />
  )
}

export { badgeVariants }
