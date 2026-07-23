import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '@/db'
import { conversations } from '@/db/schema'
import { getUserId } from '@/lib/auth-middleware'
import { eq } from 'drizzle-orm'

export const deleteConversation: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/api/chat/conversations/:id',
    {
      schema: {
        summary: 'Delete a conversation',
        tags: ['Chat'],
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request, reply)
      if (!userId) return

      const { id } = request.params

      const [conv] = await db
        .select({ userId: conversations.userId })
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1)

      if (!conv) {
        return reply.status(404).send({ message: 'conversation not found' })
      }

      if (conv.userId !== userId) {
        return reply.status(403).send({ message: 'forbidden' })
      }

      await db.delete(conversations).where(eq(conversations.id, id))

      return reply.status(200).send({ message: 'conversation deleted' })
    },
  )
}
