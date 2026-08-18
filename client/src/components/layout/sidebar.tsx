import { useAuth } from "@/hooks/use-auth"
import { useChatStore } from "@/store/chat-store"
import { SubjectNav } from "@/components/subjects/subject-nav"
import { MemoriesPanel } from "@/components/memories/memories-panel"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sparkles, LogOut, Brain, ChevronDown } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export function Sidebar() {
  const { user, logout } = useAuth()
  const title = useChatStore((s) => s.titleForCurrentSubject())
  const [showMemories, setShowMemories] = useState(false)

  return (
    <aside className="w-72 shrink-0 border-r border-border/50 bg-sidebar flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 h-14 shrink-0 border-b border-sidebar-border/50">
        <div className="flex items-center justify-center size-7 rounded-lg bg-primary/20">
          <Sparkles className="size-4 text-primary" />
        </div>
        <span className="font-semibold text-sidebar-foreground tracking-wide">Lucy</span>
        <span className="ml-auto text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          {title}
        </span>
      </div>

      {/* Subject Nav */}
      <SubjectNav />

      {/* Memories */}
      <div className="border-t border-sidebar-border/50">
        <button
          onClick={() => setShowMemories(!showMemories)}
          className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <Brain className="size-3.5" />
          Memórias
          <ChevronDown
            className={cn(
              "size-3 ml-auto transition-transform",
              showMemories && "rotate-180",
            )}
          />
        </button>
        {showMemories && (
          <div className="max-h-48 overflow-auto">
            <MemoriesPanel />
          </div>
        )}
      </div>

      {/* User */}
      <div className="border-t border-sidebar-border/50 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-8 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
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
          <button onClick={logout} title="Sair" className="p-2 rounded-md hover:bg-sidebar-accent/50 hover:text-destructive transition-colors cursor-pointer">
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
