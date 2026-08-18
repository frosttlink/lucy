import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"
import LoginPage from "@/components/auth/login-page"
import RegisterPage from "@/components/auth/register-page"
import LandingPage from "@/components/landing/landing-page"
import MateriaPage from "@/components/subjects/materia-page"
import PeriodicTablePage from "@/components/periodic-table/periodic-table-page"
import { MainLayout } from "@/components/layout/main-layout"
import { ChatArea } from "@/components/chat/chat-area"
import { ErrorBoundary } from "@/components/error-boundary"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { isAuthenticated, hydrate } = useAuth()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/app" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/app" replace /> : <RegisterPage />}
          />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ChatArea />} />
            <Route path="materia/:subjectId" element={<MateriaPage />} />
            <Route path="materia/chemistry/tabela-periodica" element={<PeriodicTablePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
