import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  GROQ_API_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
})

export const env = envSchema.parse(process.env)
