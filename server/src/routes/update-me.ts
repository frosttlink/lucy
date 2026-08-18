import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema'
import { getUserId } from '@/lib/auth-middleware'

export const updateMe: FastifyPluginAsyncZod = async (app) => {
  app.patch(
    '/api/me',
    {
      schema: {
        summary: 'Update current user profile',
        tags: ['User'],
        body: z.object({
          name: z.string().min(1),
        }),
        response: {
          200: z.object({
            id: z.string(),
            email: z.string(),
            name: z.string(),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const userId = getUserId(request, reply)
      if (!userId) return

      const { name } = request.body

      const [user] = await db
        .update(users)
        .set({ name, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning()

      if (!user) {
        return reply.status(404).send({ message: 'user not found' })
      }

      return { id: user.id, email: user.email, name: user.name }
    },
  )
}
