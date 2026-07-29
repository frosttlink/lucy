import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { db } from '@/db'
import { conversations } from '@/db/schema'
import { getUserId } from '@/lib/auth-middleware'

export const createConversation: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/api/chat/conversations',
    {
      schema: {
        summary: 'Create a new conversation',
        tags: ['Chat'],
        body: z.object({
          title: z.string().optional().default('New Conversation'),
          subject: z.string().optional().default('general'),
        }),
        response: {
          201: z.object({
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

      const { title, subject } = request.body

      const [conv] = await db
        .insert(conversations)
        .values({
          userId,
          title: title || 'New Conversation',
          subject: subject || 'general',
        })
        .returning()

      return reply.status(201).send(conv)
    },
  )
}
