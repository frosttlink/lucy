import type { Provider } from './provider'
import type {
  ChatOptions,
  CompletionResponse,
  Message,
  ToolCall,
  ToolDefinition,
} from './types'

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
const DEFAULT_MODEL = 'openai/gpt-oss-20b'

export class GroqProvider implements Provider {
  private groqKey: string
  private geminiKey: string

  constructor(groqKey: string, geminiKey: string) {
    this.groqKey = groqKey
    this.geminiKey = geminiKey
  }

  async chat(
    messages: Message[],
    tools: ToolDefinition[],
    options: ChatOptions = {},
  ): Promise<CompletionResponse> {
    const maxAttempts = 3

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const body: Record<string, unknown> = {
        model: options.model || DEFAULT_MODEL,
        temperature: attempt === 0 ? 0.7 : 0.1,
        messages: messages.map((m) => {
          if (m.role === 'tool') {
            return {
              role: 'tool',
              tool_call_id: m.tool_call_id,
              content: m.content,
            }
          }
          if (m.role === 'assistant' && m.tool_calls) {
            return {
              role: 'assistant',
              content: null,
              tool_calls: m.tool_calls.map((tc) => ({
                id: tc.id,
                type: 'function',
                function: { name: tc.name, arguments: tc.input },
              })),
            }
          }
          return { role: m.role, content: m.content }
        }),
      }

      if (options.max_tokens) {
        body.max_tokens = options.max_tokens
      }

      if (tools.length > 0) {
        body.tools = tools.map((t) => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          },
        }))
      }

      const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const err = await response.text()
        // O Llama 3.3 às vezes emite o formato legado "<function=...>"
        // em vez de um tool_call estruturado; o Groq rejeita com
        // tool_use_failed. Tenta de novo com temperatura menor antes
        // de desistir (estratégia recomendada pela própria Groq).
        const isToolUseFailure = err.includes('tool_use_failed')
        if (attempt < maxAttempts - 1 && isToolUseFailure) continue
        throw new Error(`Groq API error (${response.status}): ${err}`)
      }

      const data = (await response.json()) as {
        choices: Array<{
          message: {
            content: string | null
            tool_calls?: Array<{
              id: string
              function: { name: string; arguments: string }
            }>
          }
        }>
      }

      const choice = data.choices[0].message
      const content = choice.content || ''
      const toolCalls: ToolCall[] = (choice.tool_calls || []).map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        input: tc.function.arguments,
      }))

      return { content, tool_calls: toolCalls }
    }

    throw new Error('Groq tool call generation failed after retries')
  }

  async createEmbedding(text: string): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${this.geminiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] },
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Gemini embedding error (${response.status}): ${err}`)
    }

    const data = (await response.json()) as { embedding: { values: number[] } }
    return data.embedding.values
  }
}
