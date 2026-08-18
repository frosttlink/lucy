import { cn } from "@/lib/utils"
import { CATEGORY_CONFIG, type ElementData } from "@/data/elements"

interface ElementCellProps {
  element: ElementData
  onClick: () => void
  isHighlighted?: boolean
}

export function ElementCell({ element, onClick, isHighlighted }: ElementCellProps) {
  const config = CATEGORY_CONFIG[element.category]

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center w-[4.25rem] h-[4.75rem] rounded-lg border transition-all duration-200 cursor-pointer",
        "hover:scale-110 hover:z-10 galaxy-glow-hover",
        config.bgClass,
        config.borderClass,
        isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
      title={`${element.name} (${element.symbol})`}
    >
      <span className="absolute top-1.5 left-2 text-[10px] text-muted-foreground">
        {element.atomicNumber}
      </span>
      <span className={cn("text-xl font-bold leading-none", config.textClass)}>
        {element.symbol}
      </span>
      <span className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[56px] px-1">
        {element.name}
      </span>
      <span className="text-[8px] text-muted-foreground/60">
        {element.atomicMass}
      </span>
    </button>
  )
}