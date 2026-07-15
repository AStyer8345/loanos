import { describe, expect, it } from 'vitest'
import { redactObject, redactProhibited } from '@/lib/website-assistant/redaction'

describe('website assistant redaction', () => {
  it.each([
    ['SSN', 'My SSN is 123-45-6789', 'ssn'],
    ['DOB', 'DOB 01/14/1985', 'full_dob'],
    ['routing', 'routing number 021000021', 'routing_number'],
    ['password', 'password: hunter2', 'credential'],
  ])('redacts %s before persistence', (_label, input, type) => {
    const result = redactProhibited(input)
    expect(result.blocked).toBe(true)
    expect(result.detected).toContain(type)
    expect(result.text).not.toContain(input.split(' ').at(-1))
  })

  it('recursively redacts structured audit data', () => {
    const result = redactObject({ nested: { note: 'SSN 123-45-6789' } })
    expect(JSON.stringify(result)).not.toContain('123-45-6789')
  })
})
