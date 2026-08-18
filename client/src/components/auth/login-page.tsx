import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles } from "lucide-react"
import { Toast } from "@/components/ui/toast"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      navigate("/app")
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/20 galaxy-glow">
              <Sparkles className="size-5 text-primary" />
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Entrar na Lucy</h1>
          <p className="text-sm text-muted-foreground mt-1">Entre com sua conta para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground" htmlFor="email">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground" htmlFor="password">Senha</label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background/50 border-border/50 focus:border-primary focus:ring-primary/30"
            />
          </div>
          <Button type="submit" className="w-full galaxy-glow-hover" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Não tem conta?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Cadastre-se
          </Link>
        </p>
      </div>
      {error && <Toast message={error} variant="error" onClose={() => setError("")} />}
    </div>
  )
}
