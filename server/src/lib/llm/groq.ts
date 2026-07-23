import type { Provider } from './provider'
import type { CompletionResponse, Message, ToolDefinition, ToolCall } from './types'

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'

export class GroqProvider implements Provider {
  private groqKey: string
  private geminiKey: string

  constructor(groqKey: string, geminiKey: string) {
    this.groqKey = groqKey
    this.geminiKey = geminiKey
  }

  async chat(messages: Message[], tools: ToolDefinition[]): Promise<CompletionResponse> {
    const body: Record<string, unknown> = {
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      messages: messages.map((m) => {
        if (m.role === 'tool') {
          return { role: 'tool', tool_call_id: m.tool_call_id, content: m.content }
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
