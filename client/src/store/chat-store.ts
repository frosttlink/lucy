import { create } from "zustand"
import { getSubjectById } from "@/lib/subjects"

interface ChatState {
  activeSubject: string
  conversationId: string | null
  isStreaming: boolean
  isInitialized: boolean
  setActiveSubject: (subject: string) => void
  setConversationId: (id: string) => void
  setIsStreaming: (v: boolean) => void
  setInitialized: (v: boolean) => void
  titleForCurrentSubject: () => string
}

export const useChatStore = create<ChatState>((set, get) => ({
  activeSubject: "portuguese",
  conversationId: null,
  isStreaming: false,
  isInitialized: false,

  setActiveSubject: (subject) => set({ activeSubject: subject }),

  setConversationId: (id) => set({ conversationId: id }),

  setIsStreaming: (v) => set({ isStreaming: v }),

  setInitialized: (v) => set({ isInitialized: v }),

  titleForCurrentSubject: () => {
    const s = getSubjectById(get().activeSubject)
    return s?.label || "Geral"
  },
}))
