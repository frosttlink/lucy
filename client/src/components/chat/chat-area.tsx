import { useEffect, useState } from "react"
import { useChatStore } from "@/store/chat-store"
import { useChat } from "@/hooks/use-chat"
import { getSubjectById } from "@/lib/subjects"
import { MessageList } from "@/components/chat/message-list"
import { MessageInput } from "@/components/chat/message-input"
import { getMessages } from "@/lib/api"
import { Sparkles } from "lucide-react"

export function ChatArea() {
  const activeSubject = useChatStore((s) => s.activeSubject)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const isStreaming = useChatStore((s) => s.isStreaming)
  const setIsStreaming = useChatStore((s) => s.setIsStreaming)
  const { messages, error, connect, sendMessage, disconnect, loadMessages, clearMessages } = useChat()
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const subject = getSubjectById(activeSubject)

  useEffect(() => {
    if (activeConversationId) {
      setIsLoadingMessages(true)
      connect(activeConversationId)
      getMessages(activeConversationId)
        .then(loadMessages)
        .catch(() => {})
        .finally(() => setIsLoadingMessages(false))
    }
    return () => {
      disconnect()
      clearMessages()
    }
  }, [activeConversationId])

  function handleSend(content: string) {
    if (!activeConversationId) return
    setIsStreaming(true)
    sendMessage(content, activeSubject)
  }

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <Sparkles className="size-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Bem-vindo ao Lucy
          </h2>
          <p className="text-muted-foreground">
            Selecione uma matéria ao lado para começar a estudar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {error && (
        <div className="mx-4 mt-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
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
