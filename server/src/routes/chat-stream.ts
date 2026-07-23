import type { FastifyPluginAsync } from 'fastify'
import { verifyToken } from '@/lib/jwt'
import { appContext } from '@/lib/app-context'

export const chatStream: FastifyPluginAsync = async (app) => {
  app.get('/api/chat/conversations/:id/stream', { websocket: true }, (socket, request) => {
    const queryToken = (request.query as Record<string, string>)?.token
    if (!queryToken) {
      socket.close()
      return
    }

    try {
      const payload = verifyToken(queryToken)
      const userId = payload.user_id
      appContext.wsHub?.handleConnection(socket, userId)
    } catch {
      socket.close()
    }
  })
}
