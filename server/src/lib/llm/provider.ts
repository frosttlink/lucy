import type { CompletionResponse, Message, ToolDefinition } from './types'

export interface Provider {
  chat(messages: Message[], tools: ToolDefinition[]): Promise<CompletionResponse>
  createEmbedding(text: string): Promise<number[]>
}
