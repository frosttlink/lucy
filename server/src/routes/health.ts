import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

export const health: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/health',
    {
      schema: {
        summary: 'Health check',
        tags: ['System'],
        response: {
          200: z.object({
            status: z.string(),
            service: z.string(),
          }),
        },
      },
    },
    async () => {
      return { status: 'ok', service: 'lucy' }
    },
  )
}
