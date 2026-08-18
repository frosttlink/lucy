import { asc, eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/db'
import { conversations, messages } from '@/db/schema'
import { getUserId } from '@/lib/auth-middleware'

export const getMessages: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/chat/conversations/:id/messages',
    {
      schema: {
        summary: 'Get messages from a conversation',
        tags: ['Chat'],
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              conversationId: z.string(),
              role: z.string(),
              content: z.string(),
              tokens: z.number().nullable(),
              createdAt: z.date(),
            }),
          ),
          403: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
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

      return db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, id))
        .orderBy(asc(messages.createdAt))
    },
  )
}
