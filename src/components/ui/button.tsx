import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-mono font-medium uppercase tracking-widest',
    'rounded-[var(--radius)] border-0',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-40',
    'cursor-pointer',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:brightness-110',
        secondary:
          'bg-secondary/15 text-secondary border border-secondary/30 hover:bg-secondary/25',
        ghost: 'bg-transparent text-muted-foreground hover:bg-muted/20',
        destructive: 'bg-destructive text-white hover:brightness-110',
        outline:
          'bg-transparent text-foreground-primary border border-border hover:bg-muted/20',
        link: 'bg-transparent text-secondary underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-9 px-4 text-[0.55rem]',
        md: 'h-11 px-6 text-[0.65rem]',
        lg: 'h-12 px-8 text-[0.7rem]',
        icon: 'h-11 w-11 text-[0.65rem]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
