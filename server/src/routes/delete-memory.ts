import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/db'
import { memories } from '@/db/schema'
import { getUserId } from '@/lib/auth-middleware'

export const deleteMemory: FastifyPluginAsyncZod = async (app) => {
  app.delete(
    '/api/memory/:id',
    {
      schema: {
        summary: 'Delete a memory',
        tags: ['Memory'],
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({ status: z.string() }),
          403: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request, reply)
      if (!userId) return

      const { id } = request.params

      const [mem] = await db
        .select()
        .from(memories)
        .where(eq(memories.id, id))
        .limit(1)

      if (!mem) {
        return reply.status(404).send({ message: 'memory not found' })
      }

      if (mem.userId !== userId) {
        return reply.status(403).send({ message: 'forbidden' })
      }

      await db.delete(memories).where(eq(memories.id, id))
      return { status: 'deleted' }
    },
  )
}
