import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '@/db'
import { conversations } from '@/db/schema'
import { getUserId } from '@/lib/auth-middleware'
import { eq, desc, sql } from 'drizzle-orm'

export const listConversations: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/chat/conversations',
    {
      schema: {
        summary: 'List conversations',
        tags: ['Chat'],
        querystring: z.object({
          subject: z.string().optional(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              userId: z.string(),
              title: z.string(),
              subject: z.string(),
              createdAt: z.date(),
              updatedAt: z.date(),
            }),
          ),
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request, reply)
      if (!userId) return

      const { subject } = request.query

      let result
      if (subject) {
        result = await db
          .select()
          .from(conversations)
          .where(
            sql`${conversations.userId} = ${userId} AND ${conversations.subject} = ${subject}`,
          )
          .orderBy(desc(conversations.createdAt))
      } else {
        result = await db
          .select()
          .from(conversations)
          .where(eq(conversations.userId, userId))
          .orderBy(desc(conversations.createdAt))
      }

      return result
    },
  )
}
