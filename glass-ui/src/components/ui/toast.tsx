"use client"

import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: [
            "group toast",
            "group-[.toaster]:rounded-xl",
            "group-[.toaster]:bg-[var(--glass-bg-panel)]",
            "group-[.toaster]:backdrop-blur-xl group-[.toaster]:backdrop-saturate-[180%]",
            "group-[.toaster]:border group-[.toaster]:border-[var(--glass-border-color)]",
            "group-[.toaster]:shadow-[var(--glass-shadow-large)]",
            "group-[.toaster]:text-foreground",
          ].join(" "),
          description: "group-[.toast]:text-muted-foreground",
          actionButton: [
            "group-[.toast]:bg-[var(--glass-gradient-primary)]",
            "group-[.toast]:text-white",
            "group-[.toast]:rounded-lg",
          ].join(" "),
          cancelButton: [
            "group-[.toast]:bg-[var(--glass-bg)]",
            "group-[.toast]:text-muted-foreground",
            "group-[.toast]:rounded-lg",
          ].join(" "),
          success: [
            "group-[.toaster]:border-green-500/30",
            "group-[.toaster]:bg-green-500/10",
          ].join(" "),
          error: [
            "group-[.toaster]:border-red-500/30",
            "group-[.toaster]:bg-red-500/10",
          ].join(" "),
          warning: [
            "group-[.toaster]:border-yellow-500/30",
            "group-[.toaster]:bg-yellow-500/10",
          ].join(" "),
          info: [
            "group-[.toaster]:border-blue-500/30",
            "group-[.toaster]:bg-blue-500/10",
          ].join(" "),
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
