import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Message } from '@/lib/llm/types'

// Mock dependencies
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue([]),
    returning: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockReturnThis(),
  },
}))

vi.mock('@/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3333,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    JWT_SECRET: 'test-secret-key-min-32-chars-long!!',
    GROQ_API_KEY: 'test-groq-key',
    GEMINI_API_KEY: 'test-gemini-key',
    CORS_ORIGIN: '*',
  },
}))

describe('ChatService', () => {
  it('can be imported', async () => {
    const { ChatService } = await import('@/services/chat')
    expect(ChatService).toBeDefined()
  })
})
