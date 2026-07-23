import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '@/db'
import { users } from '@/db/schema'
import { getUserId } from '@/lib/auth-middleware'
import { eq } from 'drizzle-orm'

export const getMe: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/api/me',
    {
      schema: {
        summary: 'Get current user profile',
        tags: ['User'],
        response: {
          200: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request, reply)
      if (!userId) return

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)

      if (!user) {
        return reply.status(404).send({ message: 'user not found' })
      }

      return { id: user.id, email: user.email, name: user.name }
    },
  )
}
