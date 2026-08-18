import type {
  ChatOptions,
  CompletionResponse,
  Message,
  ToolDefinition,
} from './types'

export interface Provider {
  chat(
    messages: Message[],
    tools: ToolDefinition[],
    options?: ChatOptions,
  ): Promise<CompletionResponse>
  createEmbedding(text: string): Promise<number[]>
}
