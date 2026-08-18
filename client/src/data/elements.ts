export type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth"
  | "transition-metal"
  | "post-transition-metal"
  | "metalloid"
  | "nonmetal"
  | "noble-gas"
  | "lanthanide"
  | "actinide"

export interface ElementData {
  atomicNumber: number
  symbol: string
  name: string
  category: ElementCategory
  atomicMass: number
  electronConfig: string
  row: number
  col: number
  group: number | null
  period: number
  phase: string
  electronegativity: number | null
  description: string
}

export const CATEGORY_CONFIG: Record<
  ElementCategory,
  { labelPt: string; bgClass: string; borderClass: string; textClass: string }
> = {
  "alkali-metal": {
    labelPt: "Metal Alcalino",
    bgClass: "bg-red-500/15",
    borderClass: "border-red-500/30",
    textClass: "text-red-300",
  },
  "alkaline-earth": {
    labelPt: "Alcalino-Terroso",
    bgClass: "bg-orange-500/15",
    borderClass: "border-orange-500/30",
    textClass: "text-orange-300",
  },
  "transition-metal": {
    labelPt: "Metal de Transição",
    bgClass: "bg-yellow-500/12",
    borderClass: "border-yellow-500/25",
    textClass: "text-yellow-300",
  },
  "post-transition-metal": {
    labelPt: "Metal Pós-Transição",
    bgClass: "bg-teal-500/15",
    borderClass: "border-teal-500/30",
    textClass: "text-teal-300",
  },
  metalloid: {
    labelPt: "Metalóide",
    bgClass: "bg-emerald-500/15",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-300",
  },
  nonmetal: {
    labelPt: "Não-Metal",
    bgClass: "bg-cyan-500/15",
    borderClass: "border-cyan-500/30",
    textClass: "text-cyan-300",
  },
  "noble-gas": {
    labelPt: "Gás Nobre",
    bgClass: "bg-violet-500/15",
    borderClass: "border-violet-500/30",
    textClass: "text-violet-300",
  },
  lanthanide: {
    labelPt: "Lantanídeo",
    bgClass: "bg-pink-500/15",
    borderClass: "border-pink-500/30",
    textClass: "text-pink-300",
  },
  actinide: {
    labelPt: "Actinídeo",
    bgClass: "bg-rose-500/15",
    borderClass: "border-rose-500/30",
    textClass: "text-rose-300",
  },
}

export const ELEMENTS: ElementData[] = [
  { atomicNumber: 1, symbol: "H", name: "Hidrogênio", category: "nonmetal", atomicMass: 1.008, electronConfig: "1s¹", row: 1, col: 1, group: 1, period: 1, phase: "Gasoso", electronegativity: 2.20, description: "Elemento mais leve e abundante do universo. Presente na água e em combustíveis." },
  { atomicNumber: 2, symbol: "He", name: "Hélio", category: "noble-gas", atomicMass: 4.003, electronConfig: "1s²", row: 1, col: 18, group: 18, period: 1, phase: "Gasoso", electronegativity: null, description: "Gás nobre inerte, usado em balões e resfriamento de ímãs supercondutores." },
  { atomicNumber: 3, symbol: "Li", name: "Lítio", category: "alkali-metal", atomicMass: 6.941, electronConfig: "[He] 2s¹", row: 2, col: 1, group: 1, period: 2, phase: "Sólido", electronegativity: 0.98, description: "Metal leve usado em baterias e tratamento do transtorno bipolar." },
  { atomicNumber: 4, symbol: "Be", name: "Berílio", category: "alkaline-earth", atomicMass: 9.012, electronConfig: "[He] 2s²", row: 2, col: 2, group: 2, period: 2, phase: "Sólido", electronegativity: 1.57, description: "Metal leve e resistente, usado em aeronáutica e eletrônica." },
  { atomicNumber: 5, symbol: "B", name: "Boro", category: "metalloid", atomicMass: 10.81, electronConfig: "[He] 2s² 2p¹", row: 2, col: 13, group: 13, period: 2, phase: "Sólido", electronegativity: 2.04, description: "Metalóide usado em vidros, detergentes e materiais de alta resistência." },
  { atomicNumber: 6, symbol: "C", name: "Carbono", category: "nonmetal", atomicMass: 12.011, electronConfig: "[He] 2s² 2p²", row: 2, col: 14, group: 14, period: 2, phase: "Sólido", electronegativity: 2.55, description: "Base da química orgânica. Presente em diamantes, grafite e todas as formas de vida." },
  { atomicNumber: 7, symbol: "N", name: "Nitrogênio", category: "nonmetal", atomicMass: 14.007, electronConfig: "[He] 2s² 2p³", row: 2, col: 15, group: 15, period: 2, phase: "Gasoso", electronegativity: 3.04, description: "Compõe 78% da atmosfera. Essencial para aminoácidos e DNA." },
  { atomicNumber: 8, symbol: "O", name: "Oxigênio", category: "nonmetal", atomicMass: 15.999, electronConfig: "[He] 2s² 2p⁴", row: 2, col: 16, group: 16, period: 2, phase: "Gasoso", electronegativity: 3.44, description: "Essencial para respiração e combustão. Compõe 21% da atmosfera." },
  { atomicNumber: 9, symbol: "F", name: "Flúor", category: "nonmetal", atomicMass: 18.998, electronConfig: "[He] 2s² 2p⁵", row: 2, col: 17, group: 17, period: 2, phase: "Gasoso", electronegativity: 3.98, description: "Halogênio mais eletronegativo. Usado em pastas de dente e fluorocarbonos." },
  { atomicNumber: 10, symbol: "Ne", name: "Neônio", category: "noble-gas", atomicMass: 20.180, electronConfig: "[He] 2s² 2p⁶", row: 2, col: 18, group: 18, period: 2, phase: "Gasoso", electronegativity: null, description: "Gás nobre que emite luz alaranjada-vermelha em tubos de descarga." },
  { atomicNumber: 11, symbol: "Na", name: "Sódio", category: "alkali-metal", atomicMass: 22.990, electronConfig: "[Ne] 3s¹", row: 3, col: 1, group: 1, period: 3, phase: "Sólido", electronegativity: 0.93, description: "Metal macio que reage violentamente com água. Essencial para organismos vivos." },
  { atomicNumber: 12, symbol: "Mg", name: "Magnésio", category: "alkaline-earth", atomicMass: 24.305, electronConfig: "[Ne] 3s²", row: 3, col: 2, group: 2, period: 3, phase: "Sólido", electronegativity: 1.31, description: "Metal leve e resistente. Presente em clorofila e ligas metálicas." },
  { atomicNumber: 13, symbol: "Al", name: "Alumínio", category: "post-transition-metal", atomicMass: 26.982, electronConfig: "[Ne] 3s² 3p¹", row: 3, col: 13, group: 13, period: 3, phase: "Sólido", electronegativity: 1.61, description: "Metal leve, resistente à corrosão. Usado em embalagens e construção civil." },
  { atomicNumber: 14, symbol: "Si", name: "Silício", category: "metalloid", atomicMass: 28.086, electronConfig: "[Ne] 3s² 3p²", row: 3, col: 14, group: 14, period: 3, phase: "Sólido", electronegativity: 1.90, description: "Semicondutor essencial para eletrônica. Presente em areia e vidro." },
  { atomicNumber: 15, symbol: "P", name: "Fósforo", category: "nonmetal", atomicMass: 30.974, electronConfig: "[Ne] 3s² 3p³", row: 3, col: 15, group: 15, period: 3, phase: "Sólido", electronegativity: 2.19, description: "Essencial para DNA, ATP e ossos. Encontrado em fertilizantes." },
  { atomicNumber: 16, symbol: "S", name: "Enxofre", category: "nonmetal", atomicMass: 32.065, electronConfig: "[Ne] 3s² 3p⁴", row: 3, col: 16, group: 16, period: 3, phase: "Sólido", electronegativity: 2.58, description: "Amarelo, cheiro forte. Usado em vulcanização de borracha e ácido sulfúrico." },
  { atomicNumber: 17, symbol: "Cl", name: "Cloro", category: "nonmetal", atomicMass: 35.453, electronConfig: "[Ne] 3s² 3p⁵", row: 3, col: 17, group: 17, period: 3, phase: "Gasoso", electronegativity: 3.16, description: "Halogênio usado em desinfecção de água, sal de cozinha e PVC." },
  { atomicNumber: 18, symbol: "Ar", name: "Argônio", category: "noble-gas", atomicMass: 39.948, electronConfig: "[Ne] 3s² 3p⁶", row: 3, col: 18, group: 18, period: 3, phase: "Gasoso", electronegativity: null, description: "Gás nobre mais abundante na atmosfera após nitrogênio e oxigênio." },
  { atomicNumber: 19, symbol: "K", name: "Potássio", category: "alkali-metal", atomicMass: 39.098, electronConfig: "[Ar] 4s¹", row: 4, col: 1, group: 1, period: 4, phase: "Sólido", electronegativity: 0.82, description: "Metal essencial para funções celulares. Presente em bananas e fertilizantes." },
  { atomicNumber: 20, symbol: "Ca", name: "Cálcio", category: "alkaline-earth", atomicMass: 40.078, electronConfig: "[Ar] 4s²", row: 4, col: 2, group: 2, period: 4, phase: "Sólido", electronegativity: 1.00, description: "Essencial para ossos e dentes. Presente em calcário e gesso." },
  { atomicNumber: 21, symbol: "Sc", name: "Escândio", category: "transition-metal", atomicMass: 44.956, electronConfig: "[Ar] 3d¹ 4s²", row: 4, col: 3, group: 3, period: 4, phase: "Sólido", electronegativity: 1.36, description: "Metal de transição raro, usado em ligas leves para aeronáutica." },
  { atomicNumber: 22, symbol: "Ti", name: "Titânio", category: "transition-metal", atomicMass: 47.867, electronConfig: "[Ar] 3d² 4s²", row: 4, col: 4, group: 4, period: 4, phase: "Sólido", electronegativity: 1.54, description: "Metal resistente e leve. Usado em implantes, aeronáutica e próteses." },
  { atomicNumber: 23, symbol: "V", name: "Vanádio", category: "transition-metal", atomicMass: 50.942, electronConfig: "[Ar] 3d³ 4s²", row: 4, col: 5, group: 5, period: 4, phase: "Sólido", electronegativity: 1.63, description: "Metal usado em ligas de aço e oxidação de petróleo." },
  { atomicNumber: 24, symbol: "Cr", name: "Cromo", category: "transition-metal", atomicMass: 51.996, electronConfig: "[Ar] 3d⁵ 4s¹", row: 4, col: 6, group: 6, period: 4, phase: "Sólido", electronegativity: 1.66, description: "Metal brilhante usado em cromação, aços inoxidáveis e pigmentos." },
  { atomicNumber: 25, symbol: "Mn", name: "Manganês", category: "transition-metal", atomicMass: 54.938, electronConfig: "[Ar] 3d⁵ 4s²", row: 4, col: 7, group: 7, period: 4, phase: "Sólido", electronegativity: 1.55, description: "Metal usado em aços e pilhas alcalinas. Essencial em doses trace." },
  { atomicNumber: 26, symbol: "Fe", name: "Ferro", category: "transition-metal", atomicMass: 55.845, electronConfig: "[Ar] 3d⁶ 4s²", row: 4, col: 8, group: 8, period: 4, phase: "Sólido", electronegativity: 1.83, description: "Metal mais usado na indústria. Presente na hemoglobina e em ligas de aço." },
  { atomicNumber: 27, symbol: "Co", name: "Cobalto", category: "transition-metal", atomicMass: 58.933, electronConfig: "[Ar] 3d⁷ 4s²", row: 4, col: 9, group: 9, period: 4, phase: "Sólido", electronegativity: 1.88, description: "Metal usado em pigmentos azuis e baterias de íon-lítio." },
  { atomicNumber: 28, symbol: "Ni", name: "Níquel", category: "transition-metal", atomicMass: 58.693, electronConfig: "[Ar] 3d⁸ 4s²", row: 4, col: 10, group: 10, period: 4, phase: "Sólido", electronegativity: 1.91, description: "Metal resistente à corrosão. Usado em moedas, aços inoxidáveis e catalisadores." },
  { atomicNumber: 29, symbol: "Cu", name: "Cobre", category: "transition-metal", atomicMass: 63.546, electronConfig: "[Ar] 3d¹⁰ 4s¹", row: 4, col: 11, group: 11, period: 4, phase: "Sólido", electronegativity: 1.90, description: "Bom condutor elétrico. Usado em fios, encanamentos e moedas." },
  { atomicNumber: 30, symbol: "Zn", name: "Zinco", category: "transition-metal", atomicMass: 65.38, electronConfig: "[Ar] 3d¹⁰ 4s²", row: 4, col: 12, group: 12, period: 4, phase: "Sólido", electronegativity: 1.65, description: "Metal essencial em doses trace. Usado em galvanização e cremes solares." },
  { atomicNumber: 31, symbol: "Ga", name: "Gálio", category: "post-transition-metal", atomicMass: 69.723, electronConfig: "[Ar] 3d¹⁰ 4s² 4p¹", row: 4, col: 13, group: 13, period: 4, phase: "Sólido", electronegativity: 1.81, description: "Metal que derrete na mão. Usado em semicondutores e LEDs." },
  { atomicNumber: 32, symbol: "Ge", name: "Germânio", category: "metalloid", atomicMass: 72.64, electronConfig: "[Ar] 3d¹⁰ 4s² 4p²", row: 4, col: 14, group: 14, period: 4, phase: "Sólido", electronegativity: 2.01, description: "Semicondutor usado em fibras ópticas e eletrônica de infravermelho." },
  { atomicNumber: 33, symbol: "As", name: "Arsênio", category: "metalloid", atomicMass: 74.922, electronConfig: "[Ar] 3d¹⁰ 4s² 4p³", row: 4, col: 15, group: 15, period: 4, phase: "Sólido", electronegativity: 2.18, description: "Metaloide tóxico historicamente usado como veneno." },
  { atomicNumber: 34, symbol: "Se", name: "Selênio", category: "nonmetal", atomicMass: 78.971, electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁴", row: 4, col: 16, group: 16, period: 4, phase: "Sólido", electronegativity: 2.55, description: "Elemento trace essencial. Usado em eletrônica e suplementos." },
  { atomicNumber: 35, symbol: "Br", name: "Bromo", category: "nonmetal", atomicMass: 79.904, electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁵", row: 4, col: 17, group: 17, period: 4, phase: "Líquido", electronegativity: 2.96, description: "Único não-metal líquido à temperatura ambiente. Usado em retardantes de chama." },
  { atomicNumber: 36, symbol: "Kr", name: "Criptônio", category: "noble-gas", atomicMass: 83.798, electronConfig: "[Ar] 3d¹⁰ 4s² 4p⁶", row: 4, col: 18, group: 18, period: 4, phase: "Gasoso", electronegativity: null, description: "Gás nobre usado em iluminação e lasers." },
  { atomicNumber: 37, symbol: "Rb", name: "Rubídio", category: "alkali-metal", atomicMass: 85.468, electronConfig: "[Kr] 5s¹", row: 5, col: 1, group: 1, period: 5, phase: "Sólido", electronegativity: 0.82, description: "Metal alcalino mole, usado em relógios atômicos." },
  { atomicNumber: 38, symbol: "Sr", name: "Estrôncio", category: "alkaline-earth", atomicMass: 87.62, electronConfig: "[Kr] 5s²", row: 5, col: 2, group: 2, period: 5, phase: "Sólido", electronegativity: 0.95, description: "Metal que produz chama vermelha. Usado em fogos de artifício e ímãs." },
  { atomicNumber: 39, symbol: "Y", name: "Ítrio", category: "transition-metal", atomicMass: 88.906, electronConfig: "[Kr] 4d¹ 5s²", row: 5, col: 3, group: 3, period: 5, phase: "Sólido", electronegativity: 1.22, description: "Metal de transição usado em LEDs e supercondutores." },
  { atomicNumber: 40, symbol: "Zr", name: "Zircônio", category: "transition-metal", atomicMass: 91.224, electronConfig: "[Kr] 4d² 5s²", row: 5, col: 4, group: 4, period: 5, phase: "Sólido", electronegativity: 1.33, description: "Metal resistente à corrosão. Usado em reatores nucleares e joias." },
  { atomicNumber: 41, symbol: "Nb", name: "Nióbio", category: "transition-metal", atomicMass: 92.906, electronConfig: "[Kr] 4d⁴ 5s¹", row: 5, col: 5, group: 5, period: 5, phase: "Sólido", electronegativity: 1.6, description: "Metal supercondutor. Usado em ímãs de ressonância magnética." },
  { atomicNumber: 42, symbol: "Mo", name: "Molibdênio", category: "transition-metal", atomicMass: 95.95, electronConfig: "[Kr] 4d⁵ 5s¹", row: 5, col: 6, group: 6, period: 5, phase: "Sólido", electronegativity: 2.16, description: "Metal refratário. Usado em aços especiais e catalisadores." },
  { atomicNumber: 43, symbol: "Tc", name: "Tecneto", category: "transition-metal", atomicMass: 98, electronConfig: "[Kr] 4d⁵ 5s²", row: 5, col: 7, group: 7, period: 5, phase: "Sólido", electronegativity: 1.9, description: "Primeiro elemento artificialmente produzido. Usado em medicina nuclear." },
  { atomicNumber: 44, symbol: "Ru", name: "Rutênio", category: "transition-metal", atomicMass: 101.07, electronConfig: "[Kr] 4d⁷ 5s¹", row: 5, col: 8, group: 8, period: 5, phase: "Sólido", electronegativity: 2.2, description: "Metal raro usado em catalisadores e eletrônica." },
  { atomicNumber: 45, symbol: "Rh", name: "Ródio", category: "transition-metal", atomicMass: 102.91, electronConfig: "[Kr] 4d⁸ 5s¹", row: 5, col: 9, group: 9, period: 5, phase: "Sólido", electronegativity: 2.28, description: "Metal precioso caro. Usado em catalisadores de automóveis." },
  { atomicNumber: 46, symbol: "Pd", name: "Paládio", category: "transition-metal", atomicMass: 106.42, electronConfig: "[Kr] 4d¹⁰", row: 5, col: 10, group: 10, period: 5, phase: "Sólido", electronegativity: 2.20, description: "Metal precioso usado em catalisadores e joalheria." },
  { atomicNumber: 47, symbol: "Ag", name: "Prata", category: "transition-metal", atomicMass: 107.87, electronConfig: "[Kr] 4d¹⁰ 5s¹", row: 5, col: 11, group: 11, period: 5, phase: "Sólido", electronegativity: 1.93, description: "Melhor condutor elétrico. Usado em joias, espelhos e fotografia." },
  { atomicNumber: 48, symbol: "Cd", name: "Cádmio", category: "transition-metal", atomicMass: 112.41, electronConfig: "[Kr] 4d¹⁰ 5s²", row: 5, col: 12, group: 12, period: 5, phase: "Sólido", electronegativity: 1.69, description: "Metal tóxico. Historicamente usado em pigmentos e baterias." },
  { atomicNumber: 49, symbol: "In", name: "Índio", category: "post-transition-metal", atomicMass: 114.82, electronConfig: "[Kr] 4d¹⁰ 5s² 5p¹", row: 5, col: 13, group: 13, period: 5, phase: "Sólido", electronegativity: 1.78, description: "Metal mole usado em telas LCD e soldas." },
  { atomicNumber: 50, symbol: "Sn", name: "Estanho", category: "post-transition-metal", atomicMass: 118.71, electronConfig: "[Kr] 4d¹⁰ 5s² 5p²", row: 5, col: 14, group: 14, period: 5, phase: "Sólido", electronegativity: 1.96, description: "Metal usado em latão, solda e revestimentos de latas." },
  { atomicNumber: 51, symbol: "Sb", name: "Antimônio", category: "metalloid", atomicMass: 121.76, electronConfig: "[Kr] 4d¹⁰ 5s² 5p³", row: 5, col: 15, group: 15, period: 5, phase: "Sólido", electronegativity: 2.05, description: "Metaloide usado em ligas e retardantes de chama." },
  { atomicNumber: 52, symbol: "Te", name: "Telúrio", category: "metalloid", atomicMass: 127.60, electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁴", row: 5, col: 16, group: 16, period: 5, phase: "Sólido", electronegativity: 2.1, description: "Metaloide usado em painéis solares e semicondutores." },
  { atomicNumber: 53, symbol: "I", name: "Iodo", category: "nonmetal", atomicMass: 126.90, electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁵", row: 5, col: 17, group: 17, period: 5, phase: "Sólido", electronegativity: 2.66, description: "Halogênio essencial para tireóide. Usado em desinfetantes e contraste radiológico." },
  { atomicNumber: 54, symbol: "Xe", name: "Xenônio", category: "noble-gas", atomicMass: 131.29, electronConfig: "[Kr] 4d¹⁰ 5s² 5p⁶", row: 5, col: 18, group: 18, period: 5, phase: "Gasoso", electronegativity: 2.6, description: "Gás nobre usado em faróis de automóveis e anestésico." },
  { atomicNumber: 55, symbol: "Cs", name: "Césio", category: "alkali-metal", atomicMass: 132.91, electronConfig: "[Xe] 6s¹", row: 6, col: 1, group: 1, period: 6, phase: "Sólido", electronegativity: 0.79, description: "Metal alcalino mais reativo. Usado em relógios atômicos." },
  { atomicNumber: 56, symbol: "Ba", name: "Bário", category: "alkaline-earth", atomicMass: 137.33, electronConfig: "[Xe] 6s²", row: 6, col: 2, group: 2, period: 6, phase: "Sólido", electronegativity: 0.89, description: "Metal usado em contraste radiológico e fogos de artifício." },
  { atomicNumber: 57, symbol: "La", name: "Lantânio", category: "lanthanide", atomicMass: 138.91, electronConfig: "[Xe] 5d¹ 6s²", row: 9, col: 3, group: null, period: 6, phase: "Sólido", electronegativity: 1.1, description: "Primeiro lantanídeo. Usado em lentes ópticas e catalisadores." },
  { atomicNumber: 58, symbol: "Ce", name: "Cério", category: "lanthanide", atomicMass: 140.12, electronConfig: "[Xe] 4f¹ 5d¹ 6s²", row: 9, col: 4, group: null, period: 6, phase: "Sólido", electronegativity: 1.12, description: "Lantanídeo mais abundante. Usado em catalisadores e polimento." },
  { atomicNumber: 59, symbol: "Pr", name: "Praseodímio", category: "lanthanide", atomicMass: 140.91, electronConfig: "[Xe] 4f³ 6s²", row: 9, col: 5, group: null, period: 6, phase: "Sólido", electronegativity: 1.13, description: "Usado em ímãs de neodímio e vidros coloridos." },
  { atomicNumber: 60, symbol: "Nd", name: "Neodímio", category: "lanthanide", atomicMass: 144.24, electronConfig: "[Xe] 4f⁴ 6s²", row: 9, col: 6, group: null, period: 6, phase: "Sólido", electronegativity: 1.14, description: "Usado em ímãs superpotentes e lasers." },
  { atomicNumber: 61, symbol: "Pm", name: "Promécio", category: "lanthanide", atomicMass: 145, electronConfig: "[Xe] 4f⁵ 6s²", row: 9, col: 7, group: null, period: 6, phase: "Sólido", electronegativity: 1.13, description: "Lantanídeo radioativo. Usado em medidores de espessura." },
  { atomicNumber: 62, symbol: "Sm", name: "Samário", category: "lanthanide", atomicMass: 150.36, electronConfig: "[Xe] 4f⁶ 6s²", row: 9, col: 8, group: null, period: 6, phase: "Sólido", electronegativity: 1.17, description: "Usado em ímãs de samário-cobalto ereatores nucleares." },
  { atomicNumber: 63, symbol: "Eu", name: "Európio", category: "lanthanide", atomicMass: 151.96, electronConfig: "[Xe] 4f⁷ 6s²", row: 9, col: 9, group: null, period: 6, phase: "Sólido", electronegativity: 1.2, description: "Fosforo vermelho. Usado em telas e notas de euro." },
  { atomicNumber: 64, symbol: "Gd", name: "Gadolínio", category: "lanthanide", atomicMass: 157.25, electronConfig: "[Xe] 4f⁷ 5d¹ 6s²", row: 9, col: 10, group: null, period: 6, phase: "Sólido", electronegativity: 1.2, description: "Usado como contraste em ressonância magnética." },
  { atomicNumber: 65, symbol: "Tb", name: "Térbio", category: "lanthanide", atomicMass: 158.93, electronConfig: "[Xe] 4f⁹ 6s²", row: 9, col: 11, group: null, period: 6, phase: "Sólido", electronegativity: 1.1, description: "Usado em fosforescentes verdes e dispositivos magnetostrictivos." },
  { atomicNumber: 66, symbol: "Dy", name: "Disprósio", category: "lanthanide", atomicMass: 162.50, electronConfig: "[Xe] 4f¹⁰ 6s²", row: 9, col: 12, group: null, period: 6, phase: "Sólido", electronegativity: 1.22, description: "Usado em ímãs de neodímio para alta temperatura." },
  { atomicNumber: 67, symbol: "Ho", name: "Hólmio", category: "lanthanide", atomicMass: 164.93, electronConfig: "[Xe] 4f¹¹ 6s²", row: 9, col: 13, group: null, period: 6, phase: "Sólido", electronegativity: 1.23, description: "Possui o maior momento magnético de qualquer elemento." },
  { atomicNumber: 68, symbol: "Er", name: "Érbio", category: "lanthanide", atomicMass: 167.26, electronConfig: "[Xe] 4f¹² 6s²", row: 9, col: 14, group: null, period: 6, phase: "Sólido", electronegativity: 1.24, description: "Usado em amplificadores de fibra óptica e lasers." },
  { atomicNumber: 69, symbol: "Tm", name: "Túlio", category: "lanthanide", atomicMass: 168.93, electronConfig: "[Xe] 4f¹³ 6s²", row: 9, col: 15, group: null, period: 6, phase: "Sólido", electronegativity: 1.25, description: "Lantanídeo mais raro. Usado em dispositivos portáteis de raios X." },
  { atomicNumber: 70, symbol: "Yb", name: "Itérbio", category: "lanthanide", atomicMass: 173.05, electronConfig: "[Xe] 4f¹⁴ 6s²", row: 9, col: 16, group: null, period: 6, phase: "Sólido", electronegativity: 1.1, description: "Usado em aços inoxidáveis e chronômetros atômicos." },
  { atomicNumber: 71, symbol: "Lu", name: "Lutécio", category: "lanthanide", atomicMass: 174.97, electronConfig: "[Xe] 4f¹⁴ 5d¹ 6s²", row: 9, col: 17, group: null, period: 6, phase: "Sólido", electronegativity: 1.27, description: "Último lantanídeo. Usado em catalisadores e PET scanners." },
  { atomicNumber: 72, symbol: "Hf", name: "Háfnio", category: "transition-metal", atomicMass: 178.49, electronConfig: "[Xe] 4f¹⁴ 5d² 6s²", row: 6, col: 4, group: 4, period: 6, phase: "Sólido", electronegativity: 1.3, description: "Metal resistente à corrosão. Usado em reatores nucleares e lâminas." },
  { atomicNumber: 73, symbol: "Ta", name: "Tântalo", category: "transition-metal", atomicMass: 180.95, electronConfig: "[Xe] 4f¹⁴ 5d³ 6s²", row: 6, col: 5, group: 5, period: 6, phase: "Sólido", electronegativity: 1.5, description: "Metal resistente à corrosão. Usado em capacitores eletrônicos e implantes." },
  { atomicNumber: 74, symbol: "W", name: "Tungstênio", category: "transition-metal", atomicMass: 183.84, electronConfig: "[Xe] 4f¹⁴ 5d⁴ 6s²", row: 6, col: 6, group: 6, period: 6, phase: "Sólido", electronegativity: 2.36, description: "Metal com maior ponto de fusão. Usado em filamentos de lâmpadas." },
  { atomicNumber: 75, symbol: "Re", name: "Rênio", category: "transition-metal", atomicMass: 186.21, electronConfig: "[Xe] 4f¹⁴ 5d⁵ 6s²", row: 6, col: 7, group: 7, period: 6, phase: "Sólido", electronegativity: 1.9, description: "Metal raro usado em jatos a propulsão e catalisadores." },
  { atomicNumber: 76, symbol: "Os", name: "Ósmio", category: "transition-metal", atomicMass: 190.23, electronConfig: "[Xe] 4f¹⁴ 5d⁶ 6s²", row: 6, col: 8, group: 8, period: 6, phase: "Sólido", electronegativity: 2.2, description: "Elemento mais denso. Usado em pontas de caneta e catalisadores." },
  { atomicNumber: 77, symbol: "Ir", name: "Irídio", category: "transition-metal", atomicMass: 192.22, electronConfig: "[Xe] 4f¹⁴ 5d⁷ 6s²", row: 6, col: 9, group: 9, period: 6, phase: "Sólido", electronegativity: 2.20, description: "Metal muito duro. Usado em velas de bugigangas e contactos elétricos." },
  { atomicNumber: 78, symbol: "Pt", name: "Platina", category: "transition-metal", atomicMass: 195.08, electronConfig: "[Xe] 4f¹⁴ 5d⁹ 6s¹", row: 6, col: 10, group: 10, period: 6, phase: "Sólido", electronegativity: 2.28, description: "Metal precioso. Usado em joias, catalisadores e medicamentos." },
  { atomicNumber: 79, symbol: "Au", name: "Ouro", category: "transition-metal", atomicMass: 196.97, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", row: 6, col: 11, group: 11, period: 6, phase: "Sólido", electronegativity: 2.54, description: "Metal precioso mais conhecido. Usado em joias, eletrônica e odontologia." },
  { atomicNumber: 80, symbol: "Hg", name: "Mercúrio", category: "transition-metal", atomicMass: 200.59, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s²", row: 6, col: 12, group: 12, period: 6, phase: "Líquido", electronegativity: 2.00, description: "Único metal líquido à temperatura ambiente. Tóxico, usado em termômetros." },
  { atomicNumber: 81, symbol: "Tl", name: "Tálio", category: "post-transition-metal", atomicMass: 204.38, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹", row: 6, col: 13, group: 13, period: 6, phase: "Sólido", electronegativity: 1.62, description: "Metal tóxico. Historicamente usado como raticida." },
  { atomicNumber: 82, symbol: "Pb", name: "Chumbo", category: "post-transition-metal", atomicMass: 207.2, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²", row: 6, col: 14, group: 14, period: 6, phase: "Sólido", electronegativity: 1.87, description: "Metal denso e tóxico. Usado em baterias e blindagem contra radiação." },
  { atomicNumber: 83, symbol: "Bi", name: "Bismuto", category: "post-transition-metal", atomicMass: 208.98, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³", row: 6, col: 15, group: 15, period: 6, phase: "Sólido", electronegativity: 2.02, description: "Metal com baixo ponto de fusão. Usado em medicamentos e cosméticos." },
  { atomicNumber: 84, symbol: "Po", name: "Polônio", category: "post-transition-metal", atomicMass: 209, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴", row: 6, col: 16, group: 16, period: 6, phase: "Sólido", electronegativity: 2.0, description: "Elemento radioativo descoberto por Marie Curie." },
  { atomicNumber: 85, symbol: "At", name: "Astato", category: "nonmetal", atomicMass: 210, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵", row: 6, col: 17, group: 17, period: 6, phase: "Sólido", electronegativity: 2.2, description: "Halogênio radioativo extremamente raro na natureza." },
  { atomicNumber: 86, symbol: "Rn", name: "Radônio", category: "noble-gas", atomicMass: 222, electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶", row: 6, col: 18, group: 18, period: 6, phase: "Gasoso", electronegativity: 2.2, description: "Gás nobre radioativo. Pode causar câncer de pulmão." },
  { atomicNumber: 87, symbol: "Fr", name: "Frâncio", category: "alkali-metal", atomicMass: 223, electronConfig: "[Rn] 7s¹", row: 7, col: 1, group: 1, period: 7, phase: "Sólido", electronegativity: 0.7, description: "Metal alcalino mais raro. Extremamente radioativo." },
  { atomicNumber: 88, symbol: "Ra", name: "Rádio", category: "alkaline-earth", atomicMass: 226, electronConfig: "[Rn] 7s²", row: 7, col: 2, group: 2, period: 7, phase: "Sólido", electronegativity: 0.9, description: "Elemento radioativo descoberto por Marie Curie. Usado em radioterapia." },
  { atomicNumber: 89, symbol: "Ac", name: "Actínio", category: "actinide", atomicMass: 227, electronConfig: "[Rn] 6d¹ 7s²", row: 10, col: 3, group: null, period: 7, phase: "Sólido", electronegativity: 1.1, description: "Primeiro actinídeo. Radioativo, brilho azulado no escuro." },
  { atomicNumber: 90, symbol: "Th", name: "Tório", category: "actinide", atomicMass: 232.04, electronConfig: "[Rn] 6d² 7s²", row: 10, col: 4, group: null, period: 7, phase: "Sólido", electronegativity: 1.3, description: "Actinídeo potencialmente útil para energia nuclear." },
  { atomicNumber: 91, symbol: "Pa", name: "Protactínio", category: "actinide", atomicMass: 231.04, electronConfig: "[Rn] 5f² 6d¹ 7s²", row: 10, col: 5, group: null, period: 7, phase: "Sólido", electronegativity: 1.5, description: "Actinídeo raro e radioativo." },
  { atomicNumber: 92, symbol: "U", name: "Urânio", category: "actinide", atomicMass: 238.03, electronConfig: "[Rn] 5f³ 6d¹ 7s²", row: 10, col: 6, group: null, period: 7, phase: "Sólido", electronegativity: 1.38, description: "Usado como combustível nuclear e em blindagem." },
  { atomicNumber: 93, symbol: "Np", name: "Netúnio", category: "actinide", atomicMass: 237, electronConfig: "[Rn] 5f⁴ 6d¹ 7s²", row: 10, col: 7, group: null, period: 7, phase: "Sólido", electronegativity: 1.36, description: "Primeiro elemento transurânico sintetizado." },
  { atomicNumber: 94, symbol: "Pu", name: "Plutônio", category: "actinide", atomicMass: 244, electronConfig: "[Rn] 5f⁶ 7s²", row: 10, col: 8, group: null, period: 7, phase: "Sólido", electronegativity: 1.28, description: "Usado em armas nucleares e emsondas espaciais." },
  { atomicNumber: 95, symbol: "Am", name: "Americio", category: "actinide", atomicMass: 243, electronConfig: "[Rn] 5f⁷ 7s²", row: 10, col: 9, group: null, period: 7, phase: "Sólido", electronegativity: 1.13, description: "Usado em detectores de fumaça e fontes de raios X." },
  { atomicNumber: 96, symbol: "Cm", name: "Cúrio", category: "actinide", atomicMass: 247, electronConfig: "[Rn] 5f⁷ 6d¹ 7s²", row: 10, col: 10, group: null, period: 7, phase: "Sólido", electronegativity: 1.28, description: "Actinídeo sintetizado, nomeado em homenagem aos Curies." },
  { atomicNumber: 97, symbol: "Bk", name: "Berkélio", category: "actinide", atomicMass: 247, electronConfig: "[Rn] 5f⁹ 7s²", row: 10, col: 11, group: null, period: 7, phase: "Sólido", electronegativity: 1.3, description: "Elemento sintetizado no Laboratório Nacional de Berkeley." },
  { atomicNumber: 98, symbol: "Cf", name: "Califórnio", category: "actinide", atomicMass: 251, electronConfig: "[Rn] 5f¹⁰ 7s²", row: 10, col: 12, group: null, period: 7, phase: "Sólido", electronegativity: 1.3, description: "Usado em detectores de metais e iniciadores de reatores." },
  { atomicNumber: 99, symbol: "Es", name: "Einstênio", category: "actinide", atomicMass: 252, electronConfig: "[Rn] 5f¹¹ 7s²", row: 10, col: 13, group: null, period: 7, phase: "Sólido", electronegativity: 1.3, description: "Nomeado em homenagem a Albert Einstein." },
  { atomicNumber: 100, symbol: "Fm", name: "Férmio", category: "actinide", atomicMass: 257, electronConfig: "[Rn] 5f¹² 7s²", row: 10, col: 14, group: null, period: 7, phase: "Sólido", electronegativity: 1.3, description: "Nomeado em homenagem a Enrico Fermi." },
  { atomicNumber: 101, symbol: "Md", name: "Mendelévio", category: "actinide", atomicMass: 258, electronConfig: "[Rn] 5f¹³ 7s²", row: 10, col: 15, group: null, period: 7, phase: "Sólido", electronegativity: 1.3, description: "Nomeado em homenagem a Dmitri Mendeleev." },
  { atomicNumber: 102, symbol: "No", name: "Nobélio", category: "actinide", atomicMass: 259, electronConfig: "[Rn] 5f¹⁴ 7s²", row: 10, col: 16, group: null, period: 7, phase: "Sólido", electronegativity: 1.3, description: "Nomeado em homenagem a Alfred Nobel." },
  { atomicNumber: 103, symbol: "Lr", name: "Laurêncio", category: "actinide", atomicMass: 266, electronConfig: "[Rn] 5f¹⁴ 7s² 7p¹", row: 10, col: 17, group: null, period: 7, phase: "Sólido", electronegativity: 1.3, description: "Último actinídeo. Nomeado em homenagem a Ernest Lawrence." },
  { atomicNumber: 104, symbol: "Rf", name: "Rutherfordio", category: "transition-metal", atomicMass: 267, electronConfig: "[Rn] 5f¹⁴ 6d² 7s²", row: 7, col: 4, group: 4, period: 7, phase: "Desconhecido", electronegativity: null, description: "Elemento superpesado sintetizado. Nomeado em homenagem a Ernest Rutherford." },
  { atomicNumber: 105, symbol: "Db", name: "Dubnio", category: "transition-metal", atomicMass: 268, electronConfig: "[Rn] 5f¹⁴ 6d³ 7s²", row: 7, col: 5, group: 5, period: 7, phase: "Desconhecido", electronegativity: null, description: "Elemento superpesado sintetizado." },
  { atomicNumber: 106, symbol: "Sg", name: "Seabórgio", category: "transition-metal", atomicMass: 269, electronConfig: "[Rn] 5f¹⁴ 6d⁴ 7s²", row: 7, col: 6, group: 6, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem a Glenn Seaborg." },
  { atomicNumber: 107, symbol: "Bh", name: "Bóhrio", category: "transition-metal", atomicMass: 270, electronConfig: "[Rn] 5f¹⁴ 6d⁵ 7s²", row: 7, col: 7, group: 7, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem a Niels Bohr." },
  { atomicNumber: 108, symbol: "Hs", name: "Hássio", category: "transition-metal", atomicMass: 277, electronConfig: "[Rn] 5f¹⁴ 6d⁶ 7s²", row: 7, col: 8, group: 8, period: 7, phase: "Desconhecido", electronegativity: null, description: "Elemento superpesado sintetizado." },
  { atomicNumber: 109, symbol: "Mt", name: "Meitnério", category: "transition-metal", atomicMass: 278, electronConfig: "[Rn] 5f¹⁴ 6d⁷ 7s²", row: 7, col: 9, group: 9, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem a Lise Meitner." },
  { atomicNumber: 110, symbol: "Ds", name: "Darmstadtio", category: "transition-metal", atomicMass: 281, electronConfig: "[Rn] 5f¹⁴ 6d⁸ 7s²", row: 7, col: 10, group: 10, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem a Darmstadt, Alemanha." },
  { atomicNumber: 111, symbol: "Rg", name: "Roentgênio", category: "transition-metal", atomicMass: 282, electronConfig: "[Rn] 5f¹⁴ 6d⁹ 7s²", row: 7, col: 11, group: 11, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem a Wilhelm Röntgen." },
  { atomicNumber: 112, symbol: "Cn", name: "Copernício", category: "transition-metal", atomicMass: 285, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s²", row: 7, col: 12, group: 12, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem a Nicolau Copérnico." },
  { atomicNumber: 113, symbol: "Nh", name: "Nihônio", category: "post-transition-metal", atomicMass: 286, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹", row: 7, col: 13, group: 13, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem ao Japão (Nihon)." },
  { atomicNumber: 114, symbol: "Fl", name: "Fleróvio", category: "post-transition-metal", atomicMass: 289, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²", row: 7, col: 14, group: 14, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem a Georgy Flyorov." },
  { atomicNumber: 115, symbol: "Mc", name: "Moscóvio", category: "post-transition-metal", atomicMass: 290, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³", row: 7, col: 15, group: 15, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem a Moscou, Rússia." },
  { atomicNumber: 116, symbol: "Lv", name: "Livermório", category: "post-transition-metal", atomicMass: 293, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴", row: 7, col: 16, group: 16, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem ao Laboratório Livermore." },
  { atomicNumber: 117, symbol: "Ts", name: "Tenesso", category: "nonmetal", atomicMass: 294, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵", row: 7, col: 17, group: 17, period: 7, phase: "Desconhecido", electronegativity: null, description: "Nomeado em homenagem ao Tennessee, EUA." },
  { atomicNumber: 118, symbol: "Og", name: "Oganessônio", category: "noble-gas", atomicMass: 294, electronConfig: "[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶", row: 7, col: 18, group: 18, period: 7, phase: "Desconhecido", electronegativity: null, description: "Elemento mais pesado conhecido. Nomeado em homenagem a Yuri Oganessian." },
]
