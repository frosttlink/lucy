export interface User {
  id: string
  email: string
  name: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  subject: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface Memory {
  id: string
  user_id: string
  content: string
  type: string
  created_at: string
}

export interface WSIncomingEvent {
  type: "token" | "tool_call" | "done" | "error"
  content?: string
  tool_calls?: unknown[]
  error?: string
}

export interface WSOutgoingMessage {
  type: "message"
  conversation_id: string
  content: string
  subject: string
}

export interface SubjectConfig {
  id: string
  label: string
  icon: string
  color: string
  area: string
}

export interface SubjectGroup {
  area: string
  subjects: SubjectConfig[]
}
