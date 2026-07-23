import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { verifyToken } from '@/lib/jwt'
import { appContext } from '@/lib/app-context'
import { db } from '@/db'
import { conversations } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const chatStream: FastifyPluginAsyncZod = async (app) => {
  app.get('/api/chat/conversations/:id/stream', { websocket: true }, async (socket, request) => {
    const queryToken = (request.query as Record<string, string>)?.token
    if (!queryToken) {
      socket.close(4001, 'missing token')
      return
    }

    try {
      const payload = verifyToken(queryToken)
      const userId = payload.user_id

      const conversationId = (request.params as Record<string, string>).id

      const [conv] = await db
        .select({ userId: conversations.userId })
        .from(conversations)
        .where(eq(conversations.id, conversationId))
        .limit(1)

      if (!conv || conv.userId !== userId) {
        socket.close(4003, 'forbidden')
        return
      }

      appContext.wsHub?.handleConnection(socket, userId)
    } catch {
      socket.close(4002, 'invalid token')
    }
  })
}
