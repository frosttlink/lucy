import * as React from "react"
import { cn } from "@/lib/utils"

interface ToastProps {
  message: string
  variant?: "success" | "error" | "info"
  onClose: () => void
}

export function Toast({ message, variant = "info", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-in slide-in-from-bottom-2",
        variant === "error" && "border-destructive/50 bg-destructive/10 text-destructive",
        variant === "success" && "border-primary/50 bg-primary/10 text-primary",
        variant === "info" && "border-border bg-card text-foreground",
      )}
    >
      <span className="text-sm">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-muted-foreground hover:text-foreground cursor-pointer"
      >
        ✕
      </button>
    </div>
  )
}
