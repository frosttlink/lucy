import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  BookOpenText, PenLine, BookMarked, Languages, Palette, Dumbbell,
  Sigma, FlaskConical, Atom, Leaf, ScrollText, Globe, Users, Brain,
  Newspaper, Target, ChevronDown,
} from "lucide-react"
import { useChatStore } from "@/store/chat-store"
import { useConversations } from "@/hooks/use-conversations"
import { cn } from "@/lib/utils"
import { SUBJECT_GROUPS } from "@/lib/subjects"

const iconMap: Record<string, LucideIcon> = {
  BookOpenText, PenLine, BookMarked, Languages, Palette, Dumbbell,
  Sigma, FlaskConical, Atom, Leaf, ScrollText, Globe, Users, Brain,
  Newspaper, Target,
}

export function SubjectNav() {
  const activeSubject = useChatStore((s) => s.activeSubject)
  const setActiveSubject = useChatStore((s) => s.setActiveSubject)
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const { fetchConversations, createConversation } = useConversations()
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set())

  async function handleSelect(subjectId: string) {
    setActiveSubject(subjectId)
    setActiveConversation(null)
    await fetchConversations()
    const conv = await createConversation()
    if (conv) {
      setActiveConversation(conv.id)
    }
  }

  function toggleArea(area: string) {
    setCollapsedAreas((prev) => {
      const next = new Set(prev)
      if (next.has(area)) next.delete(area)
      else next.add(area)
      return next
    })
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
      {SUBJECT_GROUPS.map((group) => {
        const isCollapsed = collapsedAreas.has(group.area)
        return (
          <div key={group.area}>
            <button
              onClick={() => toggleArea(group.area)}
              className="flex items-center gap-1 w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-md"
            >
              <ChevronDown
                className={cn(
                  "size-3 transition-transform",
                  isCollapsed && "-rotate-90",
                )}
              />
              {group.area}
            </button>
            {!isCollapsed && (
              <div className="ml-1 space-y-0.5">
                {group.subjects.map((subject) => {
                  const Icon = iconMap[subject.icon] || BookOpenText
                  const isActive = activeSubject === subject.id
                  return (
                    <button
                      key={subject.id}
                      onClick={() => handleSelect(subject.id)}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-sm transition-all duration-150 cursor-pointer",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", subject.color)} />
                      <span className="truncate">{subject.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
