import { z } from 'zod'
import bcrypt from 'bcryptjs'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '@/db'
import { users, sessions } from '@/db/schema'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { eq } from 'drizzle-orm'

export const authLogin: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/login',
    {
      schema: {
        summary: 'Login',
        tags: ['Auth'],
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
        response: {
          200: z.object({
            access_token: z.string(),
            refresh_token: z.string(),
            user: z.object({
              id: z.string(),
              email: z.string(),
              name: z.string(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (!user) {
        return reply.status(401).send({ message: 'invalid email or password' })
      }

      const valid = await bcrypt.compare(password, user.passwordHash)
      if (!valid) {
        return reply.status(401).send({ message: 'invalid email or password' })
      }

      const accessToken = signAccessToken(user.id)
      const refreshToken = signRefreshToken(user.id)

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await db.insert(sessions).values({
        user_id: user.id,
        refresh_token: refreshToken,
        expires_at: expiresAt,
      })

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: { id: user.id, email: user.email, name: user.name },
      }
    },
  )
}
