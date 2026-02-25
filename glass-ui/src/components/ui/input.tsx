import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          "flex h-10 w-full rounded-xl px-4 py-2 text-sm",
          // Glass effect
          "bg-[var(--glass-bg-input)] backdrop-blur-md backdrop-saturate-[180%]",
          "border border-[var(--glass-border-color)]",
          "shadow-[var(--glass-shadow)]",
          // Typography
          "text-foreground placeholder:text-muted-foreground",
          // Focus state
          "transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50",
          "focus:bg-[var(--glass-bg-hover)] focus:shadow-[var(--glass-shadow-hover)]",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
