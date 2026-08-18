import { CATEGORY_CONFIG, type ElementCategory } from "@/data/elements"
import { cn } from "@/lib/utils"

interface CategoryLegendProps {
  activeCategory: ElementCategory | null
  onCategoryToggle: (category: ElementCategory) => void
}

const CATEGORY_ORDER: ElementCategory[] = [
  "alkali-metal",
  "alkaline-earth",
  "transition-metal",
  "post-transition-metal",
  "metalloid",
  "nonmetal",
  "noble-gas",
  "lanthanide",
  "actinide",
]

export function CategoryLegend({ activeCategory, onCategoryToggle }: CategoryLegendProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORY_ORDER.map((cat) => {
        const config = CATEGORY_CONFIG[cat]
        const isActive = activeCategory === cat
        return (
          <button
            key={cat}
            onClick={() => onCategoryToggle(cat)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-all duration-200 cursor-pointer",
              config.bgClass,
              config.borderClass,
              isActive && "ring-2 ring-primary ring-offset-1 ring-offset-background scale-105",
              !isActive && "opacity-60 hover:opacity-100"
            )}
          >
            <span className={cn("w-2.5 h-2.5 rounded-full", config.bgClass.replace("/15", ""), config.borderClass.replace("/30", ""))} />
            <span className={config.textClass}>{config.labelPt}</span>
          </button>
        )
      })}
    </div>
  )
}