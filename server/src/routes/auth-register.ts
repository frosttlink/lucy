import { z } from 'zod'
import bcrypt from 'bcryptjs'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '@/db'
import { users, sessions } from '@/db/schema'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { eq } from 'drizzle-orm'

export const authRegister: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/register',
    {
      schema: {
        summary: 'Create account',
        tags: ['Auth'],
        body: z.object({
          email: z.string().email(),
          name: z.string().min(1),
          password: z.string().min(6),
        }),
        response: {
          201: z.object({
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
      const { email, name, password } = request.body

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1)

      if (existing.length > 0) {
        return reply.status(409).send({ message: 'email already registered' })
      }

      const passwordHash = await bcrypt.hash(password, 10)

      const [user] = await db
        .insert(users)
        .values({ email, name, passwordHash })
        .returning()

      const accessToken = signAccessToken(user.id)
      const refreshToken = signRefreshToken(user.id)

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await db.insert(sessions).values({
        userId: user.id,
        refreshToken,
        expiresAt,
      })

      return reply.status(201).send({
        access_token: accessToken,
        refresh_token: refreshToken,
        user: { id: user.id, email: user.email, name: user.name },
      })
    },
  )
}
