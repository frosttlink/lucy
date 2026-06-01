import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { BookOpen } from "lucide-react"

export function StudySuggestion() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          Sugestão de Estudos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Selecione uma matéria e pergunte à Lucy por um plano de estudos semanal!
        </p>
      </CardContent>
    </Card>
  )
}
