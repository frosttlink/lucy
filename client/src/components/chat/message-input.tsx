import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"

interface MessageInputProps {
  onSend: (content: string) => void
  disabled: boolean
  subjectLabel: string
}

export function MessageInput({ onSend, disabled, subjectLabel }: MessageInputProps) {
  const [content, setContent] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [disabled])

  function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setContent("")
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  return (
    <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 glass rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary/30 transition-all">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Lucy está pensando..." : `Pergunte sobre ${subjectLabel}...`}
            rows={1}
            disabled={disabled}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none disabled:opacity-50 max-h-[120px]"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || disabled}
            className="shrink-0 galaxy-glow-hover"
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground/50 text-center">
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}
