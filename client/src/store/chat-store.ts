import { create } from "zustand"
import type { Conversation } from "@/types"
import { getSubjectById } from "@/lib/subjects"

interface ChatState {
  activeSubject: string
  activeConversationId: string | null
  conversations: Conversation[]
  isStreaming: boolean
  setActiveSubject: (subject: string) => void
  setActiveConversation: (id: string | null) => void
  setConversations: (convs: Conversation[]) => void
  addConversation: (conv: Conversation) => void
  removeConversation: (id: string) => void
  setIsStreaming: (v: boolean) => void
  titleForCurrentSubject: () => string
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeSubject: "portuguese",
  activeConversationId: null,
  conversations: [],
  isStreaming: false,

  setActiveSubject: (subject) => set({ activeSubject: subject }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setConversations: (convs) => set({ conversations: convs }),

  addConversation: (conv) =>
    set((state) => ({ conversations: [conv, ...state.conversations] })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
    })),

  setIsStreaming: (v) => set({ isStreaming: v }),

  titleForCurrentSubject: () => {
    const s = getSubjectById(get().activeSubject)
    return s?.label || "Geral"
  },
}))
