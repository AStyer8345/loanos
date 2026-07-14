import { describe, expect, it } from 'vitest'
import { parseTaskMutation } from './tasks'

describe('parseTaskMutation', () => {
  it('normalizes a new task and keeps the legacy text field compatible', () => {
    const result = parseTaskMutation({ title: ' Call borrower ', priority: 'high', due_at: '2026-07-14T15:00:00-05:00' }, 'create')
    expect(result.title).toBe('Call borrower')
    expect(result.text).toBe('Call borrower')
    expect(result.priority).toBe('high')
    expect(result.due_at).toBe('2026-07-14T20:00:00.000Z')
  })

  it('rejects tenant and ownership fields instead of spreading them into a write', () => {
    expect(() => parseTaskMutation({ title: 'Unsafe', organization_id: 'other-org' }, 'create'))
      .toThrow('Unsupported task field')
    expect(() => parseTaskMutation({ user_id: 'other-user' }, 'update'))
      .toThrow('Unsupported task field')
  })

  it('rejects invalid states and dates', () => {
    expect(() => parseTaskMutation({ title: 'Task', status: 'deleted' }, 'create')).toThrow('status must be one of')
    expect(() => parseTaskMutation({ due_at: 'Friday-ish' }, 'update')).toThrow('due_at must be a valid date')
  })

  it('adds completion and dismissal history timestamps', () => {
    expect(parseTaskMutation({ status: 'completed' }, 'update').completed_at).toEqual(expect.any(String))
    expect(parseTaskMutation({ status: 'dismissed' }, 'update').dismissed_at).toEqual(expect.any(String))
  })
})
