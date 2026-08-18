import { Link } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { PeriodicTable } from "@/components/periodic-table/periodic-table"

export default function PeriodicTablePage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Link
          to="/app/materia/chemistry"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Voltar para Química
        </Link>

        <div>
          <h1 className="text-2xl font-bold">Tabela Periódica Interativa</h1>
          <p className="text-muted-foreground mt-1">
            Explore os 118 elementos químicos. Clique em um elemento para ver seus detalhes.
          </p>
        </div>

        <PeriodicTable />
      </div>
    </div>
  )
}