export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

export interface ToolCall {
  id: string
  name: string
  input: string
}

export interface CompletionResponse {
  content: string
  tool_calls: ToolCall[]
}

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface ChatOptions {
  model?: string
  max_tokens?: number
}
