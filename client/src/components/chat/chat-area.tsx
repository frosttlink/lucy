import { useEffect } from "react"
import { useChatStore } from "@/store/chat-store"
import { useConversations } from "@/hooks/use-conversations"
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
  const { fetchConversations } = useConversations()
  const { messages, connect, sendMessage, disconnect, loadMessages, clearMessages } = useChat()
  const subject = getSubjectById(activeSubject)

  useEffect(() => {
    if (activeConversationId) {
      connect(activeConversationId)
      getMessages(activeConversationId)
        .then(loadMessages)
        .catch(() => {})
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
      <MessageList messages={messages} isStreaming={isStreaming} />
      <MessageInput
        onSend={handleSend}
        disabled={isStreaming}
        subjectLabel={subject?.label || "estudo"}
      />
    </div>
  )
}
