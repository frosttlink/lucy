import type { Tool, ToolParams } from './engine'

export class CalculatorTool implements Tool {
  name() {
    return 'calculator'
  }

  description() {
    return 'Evaluate mathematical expressions. Supports addition, subtraction, multiplication, division, exponents, and parentheses.'
  }

  parameters() {
    return {
      expression: {
        type: 'string',
        description:
          "The mathematical expression to evaluate (e.g., '2 + 2', '3 * 4', '2^10')",
      },
    }
  }

  required() {
    return ['expression']
  }

  async execute(params: ToolParams): Promise<string> {
    const expr = params.expression as string | undefined
    if (!expr?.trim()) throw new Error('expression is required')

    const sanitized = expr.replace(/\^/g, '**')
    const result = this.evaluate(sanitized)
    return `${expr} = ${result}`
  }

  private evaluate(expr: string): number {
    // Simple expression parser using Function constructor
    // This handles basic math safely due to strict sanitization
    const allowed = /^[\d\s+\-*/().%,^e]+$/
    if (!allowed.test(expr.replace(/\*\*/g, '^'))) {
      throw new Error('invalid expression')
    }

    try {
      const result = Function(`"use strict"; return (${expr})`)()
      if (typeof result !== 'number' || !Number.isFinite(result)) {
        throw new Error('invalid result')
      }
      return Math.round(result * 1e10) / 1e10
    } catch {
      throw new Error('failed to evaluate expression')
    }
  }
}
