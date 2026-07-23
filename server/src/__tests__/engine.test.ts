import { describe, it, expect } from 'vitest'
import { Engine } from '@/lib/tools/engine'
import { CalculatorTool } from '@/lib/tools/calculator'

describe('Engine', () => {
  it('registers and retrieves tools', () => {
    const engine = new Engine()
    const calc = new CalculatorTool()
    engine.register(calc)

    expect(engine.get('calculator')).toBe(calc)
    expect(engine.get('nonexistent')).toBeUndefined()
  })

  it('generates LLM definitions', () => {
    const engine = new Engine()
    engine.register(new CalculatorTool())

    const defs = engine.definitionsForLLM()
    expect(defs).toHaveLength(1)
    expect(defs[0].name).toBe('calculator')
  })

  it('executes a registered tool', async () => {
    const engine = new Engine()
    engine.register(new CalculatorTool())

    const result = await engine.execute('calculator', '{"expression": "1 + 1"}')
    expect(result.success).toBe(true)
    expect(result.output).toBe('1 + 1 = 2')
  })

  it('returns error for unknown tool', async () => {
    const engine = new Engine()
    const result = await engine.execute('unknown', '{}')
    expect(result.success).toBe(false)
    expect(result.error).toContain('not found')
  })

  it('returns error for invalid JSON', async () => {
    const engine = new Engine()
    engine.register(new CalculatorTool())
    const result = await engine.execute('calculator', 'not json')
    expect(result.success).toBe(false)
    expect(result.error).toContain('invalid params JSON')
  })
})
