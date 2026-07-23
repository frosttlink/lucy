import { useChatStore } from "@/store/chat-store"
import { useConversations } from "@/hooks/use-conversations"
import { cn } from "@/lib/utils"
import { MessageSquarePlus, Trash2 } from "lucide-react"

export function ConversationList() {
  const conversations = useChatStore((s) => s.conversations)
  const activeConversationId = useChatStore((s) => s.activeConversationId)
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const { createConversation, deleteConversation } = useConversations()

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    try {
      await deleteConversation(id)
    } catch {
      // silently handle
    }
  }

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
            "group flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm transition-colors cursor-pointer text-left",
            activeConversationId === conv.id
              ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          )}
        >
          <span className="truncate flex-1">{conv.title}</span>
          <button
            onClick={(e) => handleDelete(e, conv.id)}
            className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive transition-opacity"
            title="Deletar conversa"
          >
            <Trash2 className="size-3" />
          </button>
        </button>
      ))}
    </div>
  )
}
