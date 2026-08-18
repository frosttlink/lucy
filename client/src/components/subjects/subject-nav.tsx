import { useState } from "react"
import { Link } from "react-router-dom"
import type { LucideIcon } from "lucide-react"
import {
  BookOpenText, PenLine, BookMarked, Languages, Palette, Dumbbell,
  Sigma, FlaskConical, Atom, Leaf, ScrollText, Globe, Users, Brain,
  Newspaper, Target, ChevronDown, Info,
} from "lucide-react"
import { useChatStore } from "@/store/chat-store"
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
  const [collapsedAreas, setCollapsedAreas] = useState<Set<string>>(new Set())

  function handleSelect(subjectId: string) {
    setActiveSubject(subjectId)
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
                    <div
                      key={subject.id}
                      className={cn(
                        "flex items-center gap-1 rounded-md transition-all duration-150",
                        isActive
                          ? "bg-sidebar-accent"
                          : "hover:bg-sidebar-accent/50",
                      )}
                    >
                      <button
                        onClick={() => handleSelect(subject.id)}
                        className={cn(
                          "flex-1 flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer",
                          isActive
                            ? "text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", subject.color)} />
                        <span className="truncate">{subject.label}</span>
                      </button>
                      <Link
                        to={`/app/materia/${subject.id}`}
                        className={cn(
                          "p-1.5 rounded-md transition-colors shrink-0",
                          "text-muted-foreground/50 hover:text-primary hover:bg-sidebar-accent/50",
                        )}
                        title={`Ver conteúdo de ${subject.label}`}
                      >
                        <Info className="size-3.5" />
                      </Link>
                    </div>
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
