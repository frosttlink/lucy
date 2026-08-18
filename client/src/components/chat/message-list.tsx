import { useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkBreaks from "remark-breaks"
import rehypeHighlight from "rehype-highlight"
import type { Message } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"

interface MessageListProps {
  messages: Message[]
  isStreaming: boolean
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, messages[messages.length - 1]?.content])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md space-y-3">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-primary/10 galaxy-glow mx-auto">
            <Sparkles className="size-6 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground/80">
            Comece uma conversa!
          </p>
          <p className="text-sm text-muted-foreground/60">
            Pergunte sobre qualquer matéria, peça exercícios ou
            peça uma sugestão de estudo semanal.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="flex-1 px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md shadow-lg shadow-primary/10"
                  : "glass rounded-bl-md",
              )}
            >
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-bl-md px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="size-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="size-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="size-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
