import { cn } from '@/lib/utils'
import * as SeparatorPrimitive from '@radix-ui/react-separator'
import type * as React from 'react'

export function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      className={cn(
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        'bg-border',
        className,
      )}
      {...props}
    />
  )
}
