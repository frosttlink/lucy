import { useCallback } from "react"
import { useChatStore } from "@/store/chat-store"
import * as api from "@/lib/api"
import { getSubjectById } from "@/lib/subjects"

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
    const found = getSubjectById(subject)
    const label = found?.label ?? "Geral"
    const conv = await api.createConversation(
      `Nova conversa - ${label}`,
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
