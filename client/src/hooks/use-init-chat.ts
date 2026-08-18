import { useEffect } from "react"
import { useChatStore } from "@/store/chat-store"
import * as api from "@/lib/api"

export function useInitChat() {
  const isInitialized = useChatStore((s) => s.isInitialized)
  const setConversationId = useChatStore((s) => s.setConversationId)
  const setInitialized = useChatStore((s) => s.setInitialized)

  useEffect(() => {
    if (isInitialized) return

    api
      .getMyConversation()
      .then((conv) => {
        setConversationId(conv.id)
        setInitialized(true)
      })
      .catch(() => {})
  }, [isInitialized, setConversationId, setInitialized])
}
