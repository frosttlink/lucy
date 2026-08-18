import { useState, useMemo } from "react"
import { ELEMENTS, type ElementData, type ElementCategory } from "@/data/elements"
import { ElementCell } from "./element-cell"
import { ElementModal } from "./element-modal"
import { CategoryLegend } from "./category-legend"
import { Search } from "lucide-react"

export function PeriodicTable() {
  const [selectedElement, setSelectedElement] = useState<ElementData | null>(null)
  const [activeCategory, setActiveCategory] = useState<ElementCategory | null>(null)
  const [search, setSearch] = useState("")

  const filteredElements = useMemo(() => {
    return ELEMENTS.filter((el) => {
      const matchesCategory = !activeCategory || el.category === activeCategory
      const matchesSearch =
        !search ||
        el.name.toLowerCase().includes(search.toLowerCase()) ||
        el.symbol.toLowerCase().includes(search.toLowerCase()) ||
        el.atomicNumber.toString() === search
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, search])

  const mainElements = filteredElements.filter((el) => el.row <= 7)
  const lanthanides = filteredElements.filter((el) => el.category === "lanthanide")
  const actinides = filteredElements.filter((el) => el.category === "actinide")

  const isFiltered = (el: ElementData) => {
    if (!activeCategory && !search) return true
    return filteredElements.some((f) => f.atomicNumber === el.atomicNumber)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar elemento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <CategoryLegend activeCategory={activeCategory} onCategoryToggle={setActiveCategory} />

      <div className="overflow-x-auto pb-4">
        <div className="inline-block min-w-[800px]">
          <div
            className="grid gap-1.5"
            style={{ gridTemplateColumns: "repeat(18, minmax(0, 1fr))" }}
          >
            {Array.from({ length: 7 }, (_, rowIdx) =>
              Array.from({ length: 18 }, (_, colIdx) => {
                const element = mainElements.find(
                  (el) => el.row === rowIdx + 1 && el.col === colIdx + 1
                )
                if (!element) return <div key={`${rowIdx}-${colIdx}`} />
                return (
                  <div
                    key={element.atomicNumber}
                    style={{ gridRow: rowIdx + 1, gridColumn: colIdx + 1 }}
                  >
                    <ElementCell
                      element={element}
                      onClick={() => setSelectedElement(element)}
                      isHighlighted={isFiltered(element)}
                    />
                  </div>
                )
              })
            )}

            {lanthanides.length > 0 && (
              <>
                <div
                  className="flex items-center justify-center text-xs text-muted-foreground"
                  style={{ gridRow: 8, gridColumn: "1 / 3" }}
                >
                  Lant.
                </div>
                {lanthanides.map((el) => (
                  <div
                    key={el.atomicNumber}
                    style={{ gridRow: 8, gridColumn: el.col }}
                  >
                    <ElementCell
                      element={el}
                      onClick={() => setSelectedElement(el)}
                      isHighlighted={isFiltered(el)}
                    />
                  </div>
                ))}
              </>
            )}

            {actinides.length > 0 && (
              <>
                <div
                  className="flex items-center justify-center text-xs text-muted-foreground"
                  style={{ gridRow: 9, gridColumn: "1 / 3" }}
                >
                  Act.
                </div>
                {actinides.map((el) => (
                  <div
                    key={el.atomicNumber}
                    style={{ gridRow: 9, gridColumn: el.col }}
                  >
                    <ElementCell
                      element={el}
                      onClick={() => setSelectedElement(el)}
                      isHighlighted={isFiltered(el)}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <ElementModal
        element={selectedElement}
        open={!!selectedElement}
        onClose={() => setSelectedElement(null)}
      />
    </div>
  )
}