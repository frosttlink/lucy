import type { AuthResponse, Conversation, Message, Memory } from "@/types"

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080"

let accessToken: string | null = localStorage.getItem("access_token")
let refreshToken: string | null = localStorage.getItem("refresh_token")

export function setTokens(access: string, refresh: string) {
  accessToken = access
  refreshToken = refresh
  localStorage.setItem("access_token", access)
  localStorage.setItem("refresh_token", refresh)
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
}

export function getAccessToken() {
  return accessToken
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      headers["Authorization"] = `Bearer ${accessToken}`
      const retry = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (!retry.ok) {
        throw new Error(await retry.text())
      }
      return retry.json()
    }
    clearTokens()
    throw new Error("Sessão expirada")
  }

  if (!res.ok) {
    throw new Error(await res.text())
  }

  return res.json()
}

async function refreshAccessToken(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
    if (!res.ok) return false
    const data: { access_token: string; refresh_token: string } =
      await res.json()
    setTokens(data.access_token, data.refresh_token)
    return true
  } catch {
    return false
  }
}

// Auth
export function register(email: string, password: string, name: string) {
  return request<AuthResponse>("POST", "/auth/register", {
    email,
    password,
    name,
  })
}

export function login(email: string, password: string) {
  return request<AuthResponse>("POST", "/auth/login", {
    email,
    password,
  })
}

// Conversations
export function listConversations(subject?: string) {
  const qs = subject ? `?subject=${subject}` : ""
  return request<Conversation[]>("GET", `/api/chat/conversations${qs}`)
}

export function createConversation(title: string, subject: string) {
  return request<Conversation>("POST", "/api/chat/conversations", {
    title,
    subject,
  })
}

export function getMessages(conversationId: string) {
  return request<Message[]>(
    "GET",
    `/api/chat/conversations/${conversationId}/messages`,
  )
}

// Memories
export function listMemories() {
  return request<Memory[]>("GET", "/api/memory")
}

export function deleteMemory(id: string) {
  return request<void>("DELETE", `/api/memory/${id}`)
}
