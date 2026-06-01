import { useChatStore } from "@/store/chat-store"
import { useConversations } from "@/hooks/use-conversations"
import { cn } from "@/lib/utils"
import { MessageSquarePlus } from "lucide-react"

export function ConversationList() {
  const conversations = useChatStore((s) => s.conversations)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const { createConversation } = useConversations()

  return (
    <div className="space-y-1">
      <button
        onClick={createConversation}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors cursor-pointer"
      >
        <MessageSquarePlus className="size-4" />
        Nova conversa
      </button>
      {conversations.length === 0 && (
        <p className="px-3 py-4 text-xs text-muted-foreground text-center">
          Nenhuma conversa ainda
        </p>
      )}
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => setActiveConversation(conv.id)}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors cursor-pointer text-left",
            activeConversationId === conv.id
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          )}
        >
          <span className="truncate">{conv.title}</span>
        </button>
      ))}
    </div>
  )
}
