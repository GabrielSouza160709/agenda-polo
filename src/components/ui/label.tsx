import { cn } from '@/lib/utils'
import * as LabelPrimitive from '@radix-ui/react-label'
import type * as React from 'react'

export function Label({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    />
  )
}
