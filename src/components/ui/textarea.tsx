import { cn } from '@/lib/utils'
import type * as React from 'react'

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-md border border-border bg-muted px-3 py-2 text-base text-foreground outline-none transition-colors placeholder:text-[var(--text-muted)] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm',
        className,
      )}
      {...props}
    />
  )
}
