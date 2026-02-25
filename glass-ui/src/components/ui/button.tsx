import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-xl text-sm font-medium",
    "backdrop-blur-md backdrop-saturate-[180%]",
    "border border-white/10",
    "shadow-[var(--glass-shadow)]",
    "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--glass-gradient-primary)] text-white border-0",
          "hover:bg-[var(--glass-gradient-primary-hover)] hover:-translate-y-0.5 hover:shadow-[var(--glass-shadow-hover)]",
          "active:translate-y-0 active:shadow-[var(--glass-shadow)]",
        ],
        secondary: [
          "bg-[var(--glass-bg)] text-foreground",
          "hover:bg-[var(--glass-bg-hover)] hover:-translate-y-0.5 hover:shadow-[var(--glass-shadow-hover)]",
          "active:translate-y-0 active:shadow-[var(--glass-shadow)]",
        ],
        ghost: [
          "bg-transparent border-transparent shadow-none backdrop-blur-none",
          "hover:bg-[var(--glass-bg)] hover:border-white/10 hover:shadow-[var(--glass-shadow)]",
          "active:bg-[var(--glass-bg-hover)]",
        ],
        outline: [
          "bg-transparent border-[var(--glass-border-color)]",
          "hover:bg-[var(--glass-bg)] hover:-translate-y-0.5",
          "active:translate-y-0",
        ],
        destructive: [
          "bg-gradient-to-br from-red-500 to-red-600 text-white border-0",
          "hover:from-red-400 hover:to-red-500 hover:-translate-y-0.5 hover:shadow-[var(--glass-shadow-hover)]",
          "active:translate-y-0 active:shadow-[var(--glass-shadow)]",
        ],
        link: [
          "text-blue-500 underline-offset-4 shadow-none border-0 backdrop-blur-none",
          "hover:underline",
        ],
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs rounded-lg",
        lg: "h-12 px-6 text-base rounded-2xl",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
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
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
