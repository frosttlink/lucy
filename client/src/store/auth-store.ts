import { create } from "zustand"
import type { User } from "@/types"
import * as api from "@/lib/api"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    const data = await api.login(email, password)
    api.setTokens(data.access_token, data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
  },

  register: async (email, password, name) => {
    const data = await api.register(email, password, name)
    api.setTokens(data.access_token, data.refresh_token)
    set({ user: data.user, isAuthenticated: true })
  },

  logout: () => {
    api.clearTokens()
    set({ user: null, isAuthenticated: false })
  },

  hydrate: () => {
    const stored = localStorage.getItem("access_token")
    set({
      isAuthenticated: !!stored,
      isLoading: false,
    })
  },
}))
