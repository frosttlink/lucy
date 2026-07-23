import type { WebSocket } from '@fastify/websocket'
import type { ToolCall } from '@/lib/llm/types'

export interface ClientMessage {
  type: string
  conversation_id?: string
  content?: string
  subject?: string
}

type MessageHandler = (userId: string, msg: ClientMessage) => void

interface ConversationClients {
  [conversationId: string]: Set<WebSocket>
}

const HEARTBEAT_INTERVAL = 30_000
const HEARTBEAT_TIMEOUT = 10_000

export class WsHub {
  private clients: ConversationClients = {}
  private onMessageHandler: MessageHandler | null = null
  private heartbeatTimers = new Map<WebSocket, NodeJS.Timeout>()

  onMessage(handler: MessageHandler) {
    this.onMessageHandler = handler
  }

  handleConnection(socket: WebSocket, userId: string) {
    this.startHeartbeat(socket)

    socket.on('message', (raw: Buffer) => {
      try {
        const msg: ClientMessage = JSON.parse(raw.toString())
        const convId = msg.conversation_id
        if (convId) {
          if (!this.clients[convId]) {
            this.clients[convId] = new Set()
          }
          this.clients[convId].add(socket)
        }
        this.onMessageHandler?.(userId, msg)
      } catch {
        // ignore malformed messages
      }
    })

    socket.on('close', () => {
      this.stopHeartbeat(socket)
      for (const convId of Object.keys(this.clients)) {
        this.clients[convId].delete(socket)
        if (this.clients[convId].size === 0) {
          delete this.clients[convId]
        }
      }
    })

    socket.on('error', () => {
      this.stopHeartbeat(socket)
    })
  }

  private startHeartbeat(socket: WebSocket) {
    const timer = setInterval(() => {
      if (socket.readyState === socket.OPEN) {
        socket.ping()
      }
    }, HEARTBEAT_INTERVAL)
    this.heartbeatTimers.set(socket, timer)
  }

  private stopHeartbeat(socket: WebSocket) {
    const timer = this.heartbeatTimers.get(socket)
    if (timer) {
      clearInterval(timer)
      this.heartbeatTimers.delete(socket)
    }
  }

  sendToken(conversationId: string, token: string) {
    const msg = JSON.stringify({ type: 'token', content: token })
    this.broadcast(conversationId, msg)
  }

  sendToolCall(conversationId: string, toolCalls: ToolCall[]) {
    const msg = JSON.stringify({ type: 'tool_call', tool_calls: toolCalls })
    this.broadcast(conversationId, msg)
  }

  sendDone(conversationId: string) {
    const msg = JSON.stringify({ type: 'done' })
    this.broadcast(conversationId, msg)
  }

  sendError(conversationId: string, error: string) {
    const msg = JSON.stringify({ type: 'error', error })
    this.broadcast(conversationId, msg)
  }

  private broadcast(conversationId: string, msg: string) {
    const conns = this.clients[conversationId]
    if (!conns) return
    const dead: WebSocket[] = []
    for (const conn of conns) {
      try {
        if (conn.readyState === conn.OPEN) {
          conn.send(msg)
        } else {
          dead.push(conn)
        }
      } catch {
        dead.push(conn)
      }
    }
    for (const conn of dead) {
      conns.delete(conn)
    }
  }
}
