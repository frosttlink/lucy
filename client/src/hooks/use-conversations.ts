import { useCallback } from "react"
import { useChatStore } from "@/store/chat-store"
import * as api from "@/lib/api"

export function useConversations() {
  const {
    conversations,
    activeSubject,
    activeConversationId,
    setConversations,
    addConversation,
    setActiveConversation,
  } = useChatStore()

  const fetchConversations = useCallback(async () => {
    try {
      const convs = await api.listConversations(activeSubject)
      setConversations(convs)
    } catch {
      // silently handle
    }
  }, [activeSubject, setConversations])

  const createConversation = useCallback(async () => {
    const subject = useChatStore.getState().activeSubject
    const s = subject === "general" ? "Geral" : subject
    const conv = await api.createConversation(
      `Nova conversa - ${s}`,
      subject,
    )
    addConversation(conv)
    setActiveConversation(conv.id)
    return conv
  }, [addConversation, setActiveConversation])

  return {
    conversations,
    activeConversationId,
    fetchConversations,
    createConversation,
    setActiveConversation,
  }
}
