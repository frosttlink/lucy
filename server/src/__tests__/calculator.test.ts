import { describe, it, expect } from 'vitest'
import { CalculatorTool } from '@/lib/tools/calculator'

describe('CalculatorTool', () => {
  const tool = new CalculatorTool()

  it('returns correct name', () => {
    expect(tool.name()).toBe('calculator')
  })

  it('evaluates addition', async () => {
    const result = await tool.execute({ expression: '2 + 3' })
    expect(result).toBe('2 + 3 = 5')
  })

  it('evaluates multiplication', async () => {
    const result = await tool.execute({ expression: '4 * 5' })
    expect(result).toBe('4 * 5 = 20')
  })

  it('evaluates exponents', async () => {
    const result = await tool.execute({ expression: '2^10' })
    expect(result).toBe('2^10 = 1024')
  })

  it('evaluates parentheses', async () => {
    const result = await tool.execute({ expression: '(2 + 3) * 4' })
    expect(result).toBe('(2 + 3) * 4 = 20')
  })

  it('throws on empty expression', async () => {
    await expect(tool.execute({ expression: '' })).rejects.toThrow('expression is required')
  })

  it('throws on invalid expression', async () => {
    await expect(tool.execute({ expression: 'abc' })).rejects.toThrow()
  })
})
