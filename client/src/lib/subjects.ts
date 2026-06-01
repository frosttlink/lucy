import type { SubjectGroup } from "@/types"

export const SUBJECT_GROUPS: SubjectGroup[] = [
  {
    area: "Linguagens",
    subjects: [
      { id: "portuguese", label: "Português", icon: "BookOpenText", color: "text-violet-400", area: "Linguagens" },
      { id: "essay", label: "Redação", icon: "PenLine", color: "text-fuchsia-400", area: "Linguagens" },
      { id: "literature", label: "Literatura", icon: "BookMarked", color: "text-purple-400", area: "Linguagens" },
      { id: "english", label: "Inglês", icon: "Languages", color: "text-indigo-400", area: "Linguagens" },
      { id: "arts", label: "Artes", icon: "Palette", color: "text-pink-400", area: "Linguagens" },
      { id: "pe", label: "Educação Física", icon: "Dumbbell", color: "text-rose-400", area: "Linguagens" },
    ],
  },
  {
    area: "Matemática",
    subjects: [
      { id: "math", label: "Matemática", icon: "Sigma", color: "text-blue-400", area: "Matemática" },
    ],
  },
  {
    area: "Ciências da Natureza",
    subjects: [
      { id: "chemistry", label: "Química", icon: "FlaskConical", color: "text-emerald-400", area: "Ciências da Natureza" },
      { id: "physics", label: "Física", icon: "Atom", color: "text-cyan-400", area: "Ciências da Natureza" },
      { id: "biology", label: "Biologia", icon: "Leaf", color: "text-green-400", area: "Ciências da Natureza" },
    ],
  },
  {
    area: "Ciências Humanas",
    subjects: [
      { id: "history", label: "História", icon: "ScrollText", color: "text-amber-400", area: "Ciências Humanas" },
      { id: "geography", label: "Geografia", icon: "Globe", color: "text-sky-400", area: "Ciências Humanas" },
      { id: "sociology", label: "Sociologia", icon: "Users", color: "text-orange-400", area: "Ciências Humanas" },
      { id: "philosophy", label: "Filosofia", icon: "Brain", color: "text-yellow-400", area: "Ciências Humanas" },
    ],
  },
  {
    area: "Geral",
    subjects: [
      { id: "current-affairs", label: "Atualidades", icon: "Newspaper", color: "text-slate-400", area: "Geral" },
      { id: "enem", label: "ENEM", icon: "Target", color: "text-violet-400", area: "Geral" },
    ],
  },
]

export function getSubjectById(id: string) {
  for (const group of SUBJECT_GROUPS) {
    const found = group.subjects.find((s) => s.id === id)
    if (found) return found
  }
  return null
}

export function getDefaultSubject() {
  return SUBJECT_GROUPS[0].subjects[0]
}
