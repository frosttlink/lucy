import { useState, useCallback, useRef } from "react"
import { ChatSocket } from "@/lib/ws"
import { useChatStore } from "@/store/chat-store"
import type { Message, WSIncomingEvent } from "@/types"

const STREAM_TIMEOUT_MS = 60_000

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<ChatSocket | null>(null)
  const streamContentRef = useRef("")
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearStreamTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const resetStreaming = useCallback(() => {
    clearStreamTimeout()
    useChatStore.getState().setIsStreaming(false)
    streamContentRef.current = ""
  }, [clearStreamTimeout])

  const connect = useCallback((conversationId: string) => {
    socketRef.current?.disconnect()
    streamContentRef.current = ""
    clearStreamTimeout()

    const socket = new ChatSocket(conversationId)
    socketRef.current = socket

    socket.onEvent((event: WSIncomingEvent) => {
      switch (event.type) {
        case "token": {
          clearStreamTimeout()
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
          if (event.content) {
            streamContentRef.current = event.content
            const finalContent = event.content
            setMessages((prev) => {
              const last = prev[prev.length - 1]
              if (last?.role === "assistant") {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: finalContent },
                ]
              }
              return prev
            })
          }
          resetStreaming()
          break
        }
        case "tool_call": {
          break
        }
        case "error": {
          setError(event.error || "Erro desconhecido")
          resetStreaming()
          break
        }
      }
    })

    socket.onClose(() => {
      resetStreaming()
    })

    socket.connect()
    setError(null)
  }, [clearStreamTimeout, resetStreaming])

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

      useChatStore.getState().setIsStreaming(true)
      socketRef.current.sendMessage(content, subject)

      // Safety timeout: if no tokens arrive within 60s, reset streaming state
      timeoutRef.current = setTimeout(() => {
        setError("A resposta demorou demais. Tente novamente.")
        resetStreaming()
      }, STREAM_TIMEOUT_MS)
    },
    [resetStreaming],
  )

  const disconnect = useCallback(() => {
    clearStreamTimeout()
    socketRef.current?.disconnect()
    socketRef.current = null
    useChatStore.getState().setIsStreaming(false)
  }, [clearStreamTimeout])

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
