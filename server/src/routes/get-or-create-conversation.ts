import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/db'
import { conversations } from '@/db/schema'
import { getUserId } from '@/lib/auth-middleware'
import { desc, eq } from 'drizzle-orm'

export const getOrCreateConversation: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/chat/conversation',
    {
      schema: {
        summary: 'Get or create the single conversation for this user',
        tags: ['Chat'],
        response: {
          200: z.object({
            id: z.string(),
            userId: z.string(),
            title: z.string(),
            subject: z.string(),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request, reply)
      if (!userId) return

      const [existing] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.createdAt))
        .limit(1)

      if (existing) {
        return existing
      }

      const [conv] = await db
        .insert(conversations)
        .values({
          userId,
          title: 'Minha conversa',
          subject: 'general',
        })
        .returning()

      return reply.status(201).send(conv)
    },
  )
}
