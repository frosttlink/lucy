import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { useEffect } from "react"
import LoginPage from "@/components/auth/login-page"
import RegisterPage from "@/components/auth/register-page"
import { MainLayout } from "@/components/layout/main-layout"
import { ChatArea } from "@/components/chat/chat-area"
import { ErrorBoundary } from "@/components/error-boundary"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
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
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ChatArea />} />
            <Route path="chat/:subject?" element={<ChatArea />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
