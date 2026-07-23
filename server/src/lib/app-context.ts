import type { WsHub } from './ws'
import type { ChatService } from '@/services/chat'

export const appContext = {
  wsHub: null as WsHub | null,
  chatService: null as ChatService | null,
}
