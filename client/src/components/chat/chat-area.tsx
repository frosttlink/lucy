import { useEffect, useState } from "react"
import { useChatStore } from "@/store/chat-store"
import { useChat } from "@/hooks/use-chat"
import { useInitChat } from "@/hooks/use-init-chat"
import { getSubjectById } from "@/lib/subjects"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { getMessages } from "@/lib/api"

export function ChatArea() {
  const activeSubject = useChatStore((s) => s.activeSubject)
  const conversationId = useChatStore((s) => s.conversationId)
  const isInitialized = useChatStore((s) => s.isInitialized)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const { messages, error, connect, sendMessage, disconnect, loadMessages, clearMessages } = useChat()
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const subject = getSubjectById(activeSubject)

  useInitChat()

  useEffect(() => {
    if (conversationId) {
      setIsLoadingMessages(true)
      connect(conversationId)
      getMessages(conversationId)
        .then(loadMessages)
        .catch(() => {})
        .finally(() => setIsLoadingMessages(false))
    }
    return () => {
      disconnect()
      clearMessages()
    }
  }, [conversationId])

  function handleSend(content: string) {
    if (!conversationId) return
    sendMessage(content, activeSubject)
  }

  if (!isInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {error && (
        <div className="mx-4 mt-2 px-4 py-2 glass border border-destructive/20 rounded-lg text-sm text-destructive">
          {error}
        </div>
      )}
      {isLoadingMessages ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1">
            <span className="size-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="size-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="size-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      ) : (
        <MessageList messages={messages} isStreaming={isStreaming} />
      )}
      <MessageInput
        onSend={handleSend}
        disabled={isStreaming}
        subjectLabel={subject?.label || "estudo"}
      />
    </div>
  )
}
