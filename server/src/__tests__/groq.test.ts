import { afterEach, describe, expect, it, vi } from 'vitest'
import { GroqProvider } from '@/lib/llm/groq'
import type { Message } from '@/lib/llm/types'

describe('GroqProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retries with lower temperature on tool_use_failed', async () => {
    const requests: Array<{ temperature?: number }> = []
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => {
        return new Response(
          JSON.stringify({
            error: {
              message: 'Failed to call a function',
              code: 'tool_use_failed',
              failed_generation:
                '<function=web_search {"query": "música"} </function>',
            },
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        )
      })
      .mockImplementationOnce(
        async (_url: string | URL, init?: RequestInit) => {
          requests.push(JSON.parse(String(init?.body)))
          return new Response(
            JSON.stringify({
              choices: [{ message: { content: 'resposta', tool_calls: [] } }],
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        },
      )

    vi.stubGlobal('fetch', fetchMock)

    const provider = new GroqProvider('test-key', 'test-gemini')
    const messages: Message[] = [{ role: 'user', content: 'olá' }]
    const result = await provider.chat(messages, [])

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(requests).toHaveLength(1)
    expect(requests[0].temperature).toBe(0.1)
    expect(result.content).toBe('resposta')
  })

  it('throws after exhausting retries', async () => {
    const fetchMock = vi.fn().mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          error: {
            message: 'Failed to call a function',
            code: 'tool_use_failed',
            failed_generation: '<function=web_search {} </function>',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    })

    vi.stubGlobal('fetch', fetchMock)

    const provider = new GroqProvider('test-key', 'test-gemini')
    await expect(
      provider.chat([{ role: 'user', content: 'olá' }], []),
    ).rejects.toThrow('Groq API error (400)')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('passes model and max_tokens options to the API', async () => {
    const requests: Array<{ model?: string; max_tokens?: number }> = []
    const fetchMock = vi.fn().mockImplementation(async (_url, init) => {
      requests.push(JSON.parse(String(init?.body)))
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'ok', tool_calls: [] } }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    })

    vi.stubGlobal('fetch', fetchMock)

    const provider = new GroqProvider('test-key', 'test-gemini')
    const result = await provider.chat([{ role: 'user', content: 'olá' }], [], {
      model: 'llama-3.1-8b-instant',
      max_tokens: 120,
    })

    expect(requests[0].model).toBe('llama-3.1-8b-instant')
    expect(requests[0].max_tokens).toBe(120)
    expect(result.content).toBe('ok')
  })
})
