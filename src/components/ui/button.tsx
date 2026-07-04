import { cn } from '@/lib/utils'
import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-[var(--brand-hover)]',
        secondary:
          'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
        outline:
          'border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground',
      },
      size: {
        default: 'h-11 px-4 py-2',
        sm: 'h-9 min-h-9 px-3',
        lg: 'h-11 px-6',
        icon: 'h-11 w-11 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { buttonVariants }
