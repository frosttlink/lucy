import { getAccessToken } from "./api"
import type { WSIncomingEvent, WSOutgoingMessage } from "@/types"

type EventHandler = (event: WSIncomingEvent) => void

export class ChatSocket {
  private ws: WebSocket | null = null
  private conversationId: string
  private handlers: Set<EventHandler> = new Set()
  private reconnectAttempts = 0
  private maxReconnect = 3

  constructor(conversationId: string) {
    this.conversationId = conversationId
  }

  connect() {
    const token = getAccessToken()
    if (!token) return

    const baseUrl =
      import.meta.env.VITE_WS_URL ||
      import.meta.env.VITE_API_URL?.replace(/^http/, "ws") ||
      "ws://localhost:8080"

    this.ws = new WebSocket(
      `${baseUrl}/api/chat/conversations/${this.conversationId}/stream?token=${token}`,
    )

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data: WSIncomingEvent = JSON.parse(event.data)
        this.handlers.forEach((h) => h(data))
      } catch {
        // ignore malformed messages
      }
    }

    this.ws.onerror = () => {
      this.cleanup()
    }

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnect) {
        this.reconnectAttempts++
        setTimeout(() => this.connect(), 1000 * this.reconnectAttempts)
      }
    }
  }

  sendMessage(content: string, subject: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    const msg: WSOutgoingMessage = {
      type: "message",
      conversation_id: this.conversationId,
      content,
      subject,
    }
    this.ws.send(JSON.stringify(msg))
  }

  onEvent(handler: EventHandler) {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  disconnect() {
    this.maxReconnect = 0
    this.cleanup()
  }

  private cleanup() {
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onerror = null
      this.ws.onclose = null
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close()
      }
      this.ws = null
    }
  }
}
