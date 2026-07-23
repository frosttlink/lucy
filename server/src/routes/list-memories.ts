import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '@/db'
import { memories } from '@/db/schema'
import { getUserId } from '@/lib/auth-middleware'
import { eq, desc } from 'drizzle-orm'

export const listMemories: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/memory',
    {
      schema: {
        summary: 'List memories',
        tags: ['Memory'],
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              userId: z.string(),
              content: z.string(),
              type: z.string(),
              createdAt: z.date(),
            }),
          ),
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request, reply)
      if (!userId) return

      return db
        .select({
          id: memories.id,
          userId: memories.userId,
          content: memories.content,
          type: memories.type,
          createdAt: memories.createdAt,
        })
        .from(memories)
        .where(eq(memories.userId, userId))
        .orderBy(desc(memories.createdAt))
    },
  )
}
