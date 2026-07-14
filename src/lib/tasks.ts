export const TASK_STATUSES = ['open', 'in_progress', 'completed', 'dismissed'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export const TASK_SOURCES = ['manual', 'follow_up_rule', 'automation', 'ai_suggestion', 'import'] as const
export const TASK_RECURRENCES = ['daily', 'weekly', 'monthly', 'yearly'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

const EDITABLE_FIELDS = new Set([
  'title', 'text', 'description', 'status', 'priority', 'due_at', 'reminder_at',
  'snoozed_until', 'assigned_to', 'follow_up_reason', 'recurrence_rule',
  'related_loan_id', 'related_contact_id', 'is_complete', 'is_urgent',
  'completed_at', 'dismissed_at',
])

function optionalString(value: unknown, field: string, max: number): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  if (typeof value !== 'string') throw new Error(`${field} must be a string`)
  const trimmed = value.trim()
  if (trimmed.length > max) throw new Error(`${field} is too long`)
  return trimmed
}

function optionalDate(value: unknown, field: string): string | null | undefined {
  const normalized = optionalString(value, field, 64)
  if (normalized == null) return normalized
  const timestamp = new Date(normalized)
  if (Number.isNaN(timestamp.getTime())) throw new Error(`${field} must be a valid date`)
  return timestamp.toISOString()
}

function optionalEnum<T extends readonly string[]>(value: unknown, field: string, allowed: T): T[number] | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new Error(`${field} must be one of: ${allowed.join(', ')}`)
  }
  return value as T[number]
}

export function parseTaskMutation(body: unknown, mode: 'create' | 'update'): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Task body must be an object')
  const raw = body as Record<string, unknown>
  const unknown = Object.keys(raw).filter(key => !EDITABLE_FIELDS.has(key))
  if (unknown.length) throw new Error(`Unsupported task field: ${unknown[0]}`)

  const title = optionalString(raw.title ?? raw.text, 'title', 240)
  if (mode === 'create' && !title) throw new Error('title is required')

  const result: Record<string, unknown> = {}
  if (title !== undefined) {
    result.title = title
    result.text = title // legacy UI and agent writers remain compatible
  }
  const description = optionalString(raw.description, 'description', 5000)
  const reason = optionalString(raw.follow_up_reason, 'follow_up_reason', 1000)
  const assignedTo = optionalString(raw.assigned_to, 'assigned_to', 64)
  const relatedLoan = optionalString(raw.related_loan_id, 'related_loan_id', 64)
  const relatedContact = optionalString(raw.related_contact_id, 'related_contact_id', 64)
  if (description !== undefined) result.description = description
  if (reason !== undefined) result.follow_up_reason = reason
  if (assignedTo !== undefined) result.assigned_to = assignedTo
  if (relatedLoan !== undefined) result.related_loan_id = relatedLoan
  if (relatedContact !== undefined) result.related_contact_id = relatedContact

  for (const field of ['due_at', 'reminder_at', 'snoozed_until', 'completed_at', 'dismissed_at'] as const) {
    const value = optionalDate(raw[field], field)
    if (value !== undefined) result[field] = value
  }
  const status = optionalEnum(raw.status, 'status', TASK_STATUSES)
  const priority = optionalEnum(raw.priority, 'priority', TASK_PRIORITIES)
  const recurrence = raw.recurrence_rule === null ? null : optionalEnum(raw.recurrence_rule, 'recurrence_rule', TASK_RECURRENCES)
  if (status !== undefined) result.status = status
  if (priority !== undefined) result.priority = priority
  if (recurrence !== undefined) result.recurrence_rule = recurrence

  for (const field of ['is_complete', 'is_urgent'] as const) {
    if (raw[field] !== undefined) {
      if (typeof raw[field] !== 'boolean') throw new Error(`${field} must be a boolean`)
      result[field] = raw[field]
    }
  }
  if (raw.is_urgent === true && priority === undefined) result.priority = 'urgent'
  if (status === 'completed' && raw.completed_at === undefined) result.completed_at = new Date().toISOString()
  if (status === 'dismissed' && raw.dismissed_at === undefined) result.dismissed_at = new Date().toISOString()
  return result
}
