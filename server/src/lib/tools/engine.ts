import type { ToolDefinition } from '@/lib/llm/types'

export interface ToolParams {
  [key: string]: unknown
}

export interface ToolResult {
  tool_name: string
  success: boolean
  output: string
  error?: string
}

export interface Tool {
  name(): string
  description(): string
  parameters(): Record<string, unknown>
  execute(params: ToolParams): Promise<string>
}

export class Engine {
  private tools = new Map<string, Tool>()

  register(tool: Tool) {
    this.tools.set(tool.name(), tool)
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  definitionsForLLM(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name(),
      description: t.description(),
      parameters: {
        type: 'object',
        properties: t.parameters(),
      },
    }))
  }

  async execute(name: string, inputJSON: string): Promise<ToolResult> {
    const tool = this.tools.get(name)
    if (!tool) {
      return { tool_name: name, success: false, output: '', error: `tool '${name}' not found` }
    }

    let params: ToolParams
    try {
      params = JSON.parse(inputJSON)
    } catch {
      return { tool_name: name, success: false, output: '', error: 'invalid params JSON' }
    }

    try {
      const output = await tool.execute(params)
      return { tool_name: name, success: true, output }
    } catch (err) {
      return { tool_name: name, success: false, output: '', error: (err as Error).message }
    }
  }
}
