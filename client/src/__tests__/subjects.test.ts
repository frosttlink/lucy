import { describe, it, expect } from 'vitest'
import { getSubjectById, getDefaultSubject, SUBJECT_GROUPS } from '@/lib/subjects'

describe('subjects', () => {
  it('has 5 groups', () => {
    expect(SUBJECT_GROUPS).toHaveLength(5)
  })

  it('has 16 total subjects', () => {
    const total = SUBJECT_GROUPS.reduce((acc, g) => acc + g.subjects.length, 0)
    expect(total).toBe(16)
  })

  it('finds subject by id', () => {
    const subject = getSubjectById('math')
    expect(subject).not.toBeNull()
    expect(subject?.label).toBe('Matemática')
  })

  it('returns null for unknown id', () => {
    expect(getSubjectById('unknown')).toBeNull()
  })

  it('gets default subject', () => {
    const def = getDefaultSubject()
    expect(def.id).toBe('portuguese')
  })
})
