import * as React from 'react'
import { cn } from '../../lib/utils'

const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-[var(--radius)] border border-input bg-transparent px-3 py-1',
        'font-mono text-[0.65rem] uppercase tracking-widest text-foreground',
        'transition-[color,box-shadow] outline-none',
        'placeholder:text-muted-foreground placeholder:normal-case placeholder:tracking-normal',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/30',
        className
      )}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export { Input }
