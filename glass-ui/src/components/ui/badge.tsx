import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center rounded-full px-2.5 py-0.5",
    "text-xs font-medium",
    "backdrop-blur-sm backdrop-saturate-[180%]",
    "border",
    "transition-colors duration-150",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-[var(--glass-bg)] border-[var(--glass-border-color)]",
          "text-foreground",
        ],
        primary: [
          "bg-blue-500/20 border-blue-500/30",
          "text-blue-600 dark:text-blue-400",
        ],
        secondary: [
          "bg-[var(--glass-bg)] border-[var(--glass-border-subtle)]",
          "text-muted-foreground",
        ],
        success: [
          "bg-green-500/20 border-green-500/30",
          "text-green-600 dark:text-green-400",
        ],
        warning: [
          "bg-yellow-500/20 border-yellow-500/30",
          "text-yellow-600 dark:text-yellow-400",
        ],
        error: [
          "bg-red-500/20 border-red-500/30",
          "text-red-600 dark:text-red-400",
        ],
        outline: [
          "bg-transparent border-[var(--glass-border-color)]",
          "text-foreground",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
