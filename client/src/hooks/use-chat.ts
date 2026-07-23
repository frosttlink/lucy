import { useCallback, useRef, useState } from "react"
import { ChatSocket } from "@/lib/ws"
import { useChatStore } from "@/store/chat-store"
import type { Message, WSIncomingEvent } from "@/types"

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<ChatSocket | null>(null)
  const streamContentRef = useRef("")

  const connect = useCallback((conversationId: string) => {
    socketRef.current?.disconnect()
    streamContentRef.current = ""

    const socket = new ChatSocket(conversationId)
    socketRef.current = socket

    socket.onEvent((event: WSIncomingEvent) => {
      switch (event.type) {
        case "token": {
          streamContentRef.current += event.content || ""
          const current = streamContentRef.current
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...last, content: current },
              ]
            }
            return [
              ...prev,
              {
                id: "streaming",
                conversation_id: conversationId,
                role: "assistant",
                content: current,
                created_at: new Date().toISOString(),
              },
            ]
          })
          break
        }
        case "done": {
          useChatStore.getState().setIsStreaming(false)
          streamContentRef.current = ""
          break
        }
        case "tool_call": {
          break
        }
        case "error": {
          setError(event.error || "Erro desconhecido")
          useChatStore.getState().setIsStreaming(false)
          break
        }
      }
    })

    socket.connect()
    useChatStore.getState().setIsStreaming(true)
    setError(null)
  }, [])

  const sendMessage = useCallback(
    (content: string, subject: string) => {
      if (!socketRef.current || !content.trim()) return

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          conversation_id: "",
          role: "user",
          content,
          created_at: new Date().toISOString(),
        },
      ])

      socketRef.current.sendMessage(content, subject)
    },
    [],
  )

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect()
    socketRef.current = null
    useChatStore.getState().setIsStreaming(false)
  }, [])

  const loadMessages = useCallback((msgs: Message[]) => {
    setMessages(msgs)
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    streamContentRef.current = ""
  }, [])

  return {
    messages,
    error,
    connect,
    sendMessage,
    disconnect,
    loadMessages,
    clearMessages,
  }
}
