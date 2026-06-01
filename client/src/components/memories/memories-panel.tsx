import { useState, useEffect } from "react"
import { listMemories, deleteMemory } from "@/lib/api"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { Memory } from "@/types"

export function MemoriesPanel() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listMemories()
      .then(setMemories)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id: string) {
    try {
      await deleteMemory(id)
      setMemories((prev) => prev.filter((m) => m.id !== id))
    } catch {}
  }

  if (loading) {
    return <p className="text-xs text-muted-foreground p-3">Carregando...</p>
  }

  if (memories.length === 0) {
    return <p className="text-xs text-muted-foreground p-3">Nenhuma memória salva</p>
  }

  return (
    <ScrollArea className="max-h-60">
      <div className="space-y-2 p-3">
        {memories.map((mem) => (
          <div key={mem.id} className="flex items-start gap-2 group">
            <p className="text-xs text-muted-foreground flex-1 line-clamp-2">
              {mem.content}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(mem.id)}
              className="opacity-0 group-hover:opacity-100 size-6 p-0"
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
