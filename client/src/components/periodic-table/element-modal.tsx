import { Dialog, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CATEGORY_CONFIG, type ElementData } from "@/data/elements"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ElementModalProps {
  element: ElementData | null
  open: boolean
  onClose: () => void
}

export function ElementModal({ element, open, onClose }: ElementModalProps) {
  if (!element) return null

  const config = CATEGORY_CONFIG[element.category]

  return (
    <Dialog open={open} onOpenChange={onClose} className="glass galaxy-glow">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <span className={cn("text-4xl font-bold", config.textClass)}>
            {element.symbol}
          </span>
          <div>
            <div className="text-lg font-semibold">{element.name}</div>
            <div className="text-xs text-muted-foreground">
              Número atômico: {element.atomicNumber}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Massa Atômica</div>
            <div className="text-sm font-medium">{element.atomicMass}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Categoria</div>
            <div className={cn("text-sm font-medium", config.textClass)}>
              {config.labelPt}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Config. Eletrônica</div>
            <div className="text-sm font-medium font-mono">{element.electronConfig}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Fase (25°C)</div>
            <div className="text-sm font-medium">{element.phase}</div>
          </div>
          {element.group !== null && (
            <div className="p-3 rounded-lg bg-muted/30">
              <div className="text-xs text-muted-foreground mb-1">Grupo</div>
              <div className="text-sm font-medium">{element.group}</div>
            </div>
          )}
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="text-xs text-muted-foreground mb-1">Período</div>
            <div className="text-sm font-medium">{element.period}</div>
          </div>
          {element.electronegativity !== null && (
            <div className="p-3 rounded-lg bg-muted/30 col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Eletronegatividade (Pauling)</div>
              <div className="text-sm font-medium">{element.electronegativity}</div>
            </div>
          )}
        </div>

        <div className="p-3 rounded-lg bg-muted/30">
          <div className="text-xs text-muted-foreground mb-1">Descrição</div>
          <div className="text-sm leading-relaxed">{element.description}</div>
        </div>
      </div>
    </Dialog>
  )
}