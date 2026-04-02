import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-primary/25 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(201,168,76,0.1)]',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-destructive/25 bg-destructive/10 text-destructive shadow-[inset_0_1px_0_rgba(220,38,38,0.1)]',
        outline: 'border-input text-muted-foreground',
        success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 shadow-[inset_0_1px_0_rgba(74,222,128,0.1)]',
        warning: 'border-amber-500/25 bg-amber-500/10 text-amber-400 shadow-[inset_0_1px_0_rgba(245,158,11,0.1)]',
        info: 'border-blue-500/25 bg-blue-500/10 text-blue-400 shadow-[inset_0_1px_0_rgba(59,130,246,0.1)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
