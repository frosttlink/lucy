import { eq } from 'drizzle-orm'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import { signAccessToken, signRefreshToken, verifyToken } from '@/lib/jwt'

export const authRefresh: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/refresh',
    {
      schema: {
        summary: 'Refresh access token',
        tags: ['Auth'],
        body: z.object({
          refresh_token: z.string(),
        }),
        response: {
          200: z.object({
            access_token: z.string(),
            refresh_token: z.string(),
          }),
          401: z.object({ message: z.string() }),
        },
      },
    },
    async (request, reply) => {
      const { refresh_token } = request.body

      let payload: { user_id: string }
      try {
        payload = verifyToken(refresh_token)
      } catch {
        return reply.status(401).send({ message: 'invalid refresh token' })
      }

      const [session] = await db
        .select()
        .from(sessions)
        .where(eq(sessions.refreshToken, refresh_token))
        .limit(1)

      if (!session) {
        return reply.status(401).send({ message: 'session not found' })
      }

      await db.delete(sessions).where(eq(sessions.id, session.id))

      const accessToken = signAccessToken(payload.user_id)
      const newRefreshToken = signRefreshToken(payload.user_id)

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await db.insert(sessions).values({
        userId: payload.user_id,
        refreshToken: newRefreshToken,
        expiresAt,
      })

      return { access_token: accessToken, refresh_token: newRefreshToken }
    },
  )
}
