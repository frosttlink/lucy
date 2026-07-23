import { useAuth } from "@/hooks/use-auth"
import { useChatStore } from "@/store/chat-store"
import { SubjectNav } from "@/components/subjects/subject-nav"
import { ConversationList } from "@/components/chat/conversation-list"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sparkles, LogOut } from "lucide-react"

export function Sidebar() {
  const { user, logout } = useAuth()
  const title = useChatStore((s) => s.titleForCurrentSubject())

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-sidebar flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 h-14 shrink-0 border-b border-sidebar-border">
        <Sparkles className="size-5 text-primary" />
        <span className="font-semibold text-sidebar-foreground">Lucy</span>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {title}
        </span>
      </div>

      {/* Subject Nav */}
      <SubjectNav />

      <Separator className="mx-4 w-auto" />

      {/* Conversations */}
      <div className="px-3 py-2">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-1">
          Conversas
        </h3>
      </div>
      <ScrollArea className="flex-1 px-3">
        <ConversationList />
      </ScrollArea>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback>
              {user?.name?.charAt(0)?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} title="Sair">
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
