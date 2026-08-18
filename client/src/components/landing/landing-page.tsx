import { Link } from "react-router-dom"
import {
  Sparkles, MessageSquare, BookOpen, Mic, ChevronRight,
  Rocket, Brain, CheckCircle, Zap, GraduationCap, Clock,
} from "lucide-react"

const features = [
  {
    icon: MessageSquare,
    title: "Chat com IA",
    desc: "Converse com a Lucy sobre qualquer matéria. Ela responde como um tutor particular, no seu ritmo, com explicações claras e exemplos práticos.",
  },
  {
    icon: BookOpen,
    title: "Resumos ENEM",
    desc: "Cada matéria com tópicos detalhados que caem no ENEM, resumos objetivos e dicas de estudo aprovadas por aprovados.",
  },
  {
    icon: Mic,
    title: "Voz natural",
    desc: "Fale com a Lucy pelo microfone. Ela escuta, entende e responde em áudio — como um Siri dos estudos.",
  },
]

const howItWorks = [
  {
    icon: Rocket,
    step: "01",
    title: "Cadastre-se",
    desc: "Crie sua conta gratuita em segundos. Sem cartão de crédito, sem pegadinhas.",
  },
  {
    icon: Brain,
    step: "02",
    title: "Escolha a matéria",
    desc: "Selecione o assunto que quer estudar: Português, Matemática, Química, ou qualquer uma das 16 matérias disponíveis.",
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "Converse com a IA",
    desc: "Faça perguntas, peça exercícios, tire dúvidas. A Lucy responde na hora, com linguagem simples e didática.",
  },
]

const stats = [
  { value: "118", label: "Elementos Químicos", icon: Zap },
  { value: "16", label: "Matérias ENEM", icon: BookOpen },
  { value: "100%", label: "Gratuito", icon: CheckCircle },
  { value: "24/7", label: "Disponível", icon: Clock },
]

const enemAreas = [
  { icon: "🗣️", name: "Linguagens", count: 6 },
  { icon: "📐", name: "Matemática", count: 1 },
  { icon: "🔬", name: "Ciências da Natureza", count: 3 },
  { icon: "🌍", name: "Ciências Humanas", count: 4 },
  { icon: "📚", name: "Geral", count: 2 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Lucy
          </Link>
          <div className="flex items-center gap-4">
            <a
              href="#subjects"
              className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block"
            >
              Matérias
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block"
            >
              Como funciona
            </a>
            <Link
              to="/login"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center h-9 px-4 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all"
            >
              Começar agora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 text-center">
        {/* Animated glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/8 blur-[120px] animate-[galaxy-pulse_6s_ease-in-out_infinite]" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full bg-secondary/8 blur-[100px] animate-[galaxy-pulse_8s_ease-in-out_infinite_2s]" />
        </div>

        <div className="max-w-3xl mx-auto flex flex-col items-center relative">
          <span className="inline-block text-xs font-medium tracking-wide uppercase px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/70 mb-8">
            100% gratuito para estudantes
          </span>

          <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
              Estude com uma IA
            </span>
            <br />
            <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
              que entende o ENEM
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mb-12 leading-relaxed">
            A Lucy responde suas dúvidas, cria resumos personalizados e monta planos de estudo
            — tudo de graça, a qualquer hora do dia.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-20">
            <Link
              to="/register"
              className="inline-flex items-center justify-center h-13 px-10 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all galaxy-glow-hover"
            >
              Começar agora
              <ChevronRight className="size-5 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center h-13 px-10 text-base font-medium rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-all"
            >
              Como funciona
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-2xl">
            {stats.map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center">
                <stat.icon className="size-5 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como funciona
          </h2>
          <p className="text-white/50 mb-16 max-w-lg mx-auto">
            Três passos simples para começar a estudar com inteligência artificial
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, i) => (
              <div key={item.step} className="relative">
                {i < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="glass rounded-2xl p-8 galaxy-glow-hover transition-all duration-300 h-full">
                  <div className="text-5xl font-bold text-primary/15 mb-4">{item.step}</div>
                  <div className="inline-flex items-center justify-center size-12 rounded-xl bg-primary/10 mb-4">
                    <item.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-secondary/5 to-primary/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa
            </h2>
            <p className="text-white/50 max-w-lg mx-auto">
              Ferramentas poderosas para acelerar seus estudos e garantir uma boa nota no ENEM
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="glass rounded-2xl p-8 galaxy-glow-hover transition-all duration-300 group hover:scale-[1.02]"
              >
                <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Preview */}
      <section id="subjects" className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Todas as matérias do ENEM
          </h2>
          <p className="text-white/50 mb-12">Escolha uma área para começar</p>

          <div className="flex flex-wrap justify-center gap-4">
            {enemAreas.map((area) => (
              <Link
                key={area.name}
                to="/register"
                className="glass rounded-2xl p-5 flex items-center gap-4 min-w-[200px] flex-1 max-w-[260px] galaxy-glow-hover transition-all duration-300 hover:scale-[1.02]"
              >
                <span className="text-3xl">{area.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-sm">{area.name}</div>
                  <div className="text-xs text-white/40">{area.count} matérias</div>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30 ml-auto" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
          <div className="galaxy-glow rounded-full p-8 mb-8 animate-[galaxy-pulse_4s_ease-in-out_infinite]">
            <GraduationCap className="size-12 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para decolar nos estudos?
          </h2>
          <p className="text-white/50 mb-8 max-w-md">
            Crie sua conta gratuita e comece agora mesmo. Sem cartão, sem compromisso.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center h-13 px-10 text-base font-semibold rounded-xl bg-primary text-primary-foreground hover:brightness-110 transition-all galaxy-glow-hover"
          >
            Criar conta grátis
            <ChevronRight className="size-5 ml-1" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span className="font-semibold text-sm">Lucy</span>
            <span className="text-white/30 text-xs ml-2">2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/40">
            <a href="#features" className="hover:text-white transition-colors">Recursos</a>
            <a href="#subjects" className="hover:text-white transition-colors">Matérias</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Como funciona</a>
          </div>
          <p className="text-white/25 text-xs">
            Feito com dedicação para estudantes do ENEM
          </p>
        </div>
      </footer>
    </div>
  )
}