export const WEBSITE_ASSISTANT_OPERATIONS = [
  'create_or_update_website_lead',
  'create_follow_up_task',
  'send_application_link',
  'get_available_call_times',
  'schedule_consultation',
  'escalate_to_adam',
  'record_conversation_turn',
] as const

export type WebsiteAssistantOperation = typeof WEBSITE_ASSISTANT_OPERATIONS[number]

export type ConsentEvidence = {
  type: 'privacy' | 'email' | 'sms'
  status: 'granted' | 'denied' | 'withdrawn' | 'not_requested'
  policyVersion: string
  wordingHash?: string
  consentedAt?: string
}

export type BaseOperationInput = {
  conversationId: string
  correlationId: string
  toolInvocationId?: string
}

export type OperationInput =
  | (BaseOperationInput & {
      operation: 'create_or_update_website_lead'
      firstName: string
      lastName?: string
      email?: string
      phone?: string
      leadIntent: 'purchase' | 'refinance' | 'investment' | 'information' | 'other'
      timeline?: 'within_30_days' | '31_to_90_days' | 'more_than_90_days' | 'unsure'
      preferredContact?: 'email' | 'phone' | 'text'
      sourcePage?: string
      consents: ConsentEvidence[]
    })
  | (BaseOperationInput & {
      operation: 'create_follow_up_task'
      contactId: string
      reason: string
      dueAt: string
      priority: 'low' | 'normal' | 'high' | 'urgent'
    })
  | (BaseOperationInput & {
      operation: 'send_application_link'
      contactId?: string
      delivery: 'chat' | 'email' | 'text'
      consentPolicyVersion?: string
    })
  | (BaseOperationInput & {
      operation: 'get_available_call_times'
      timezone: string
      dateFrom: string
      dateTo: string
    })
  | (BaseOperationInput & {
      operation: 'schedule_consultation'
      contactId?: string
      startAt: string
      timezone: string
      visitorName: string
      visitorEmail?: string
      visitorPhone?: string
      consentPolicyVersion?: string
    })
  | (BaseOperationInput & {
      operation: 'escalate_to_adam'
      contactId?: string
      reason: 'human_requested' | 'unsupported' | 'complaint' | 'fair_lending' | 'accessibility' | 'sensitive_data' | 'urgent' | 'failed_operation' | 'licensed_advice' | 'repeated_failure'
      safeSummary: string
    })
  | (BaseOperationInput & {
      operation: 'record_conversation_turn'
      sessionHash: string
      visitorMessage: string
      assistantMessage: string
      sequenceStart: number
      knowledgeVersion?: string
      sourceRefs: string[]
      policyOutcome: Record<string, boolean | string | number>
      modelRequestId?: string
    })

export type OperationResult = {
  ok: boolean
  operation: WebsiteAssistantOperation
  status: string
  correlationId: string
  data?: Record<string, unknown>
  error?: { code: string; message: string; retryable: boolean }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const E164 = /^\+[1-9]\d{7,14}$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

function text(value: unknown, name: string, max: number, required = true): string | undefined {
  if (value == null || value === '') {
    if (required) throw new Error(`${name} is required`)
    return undefined
  }
  if (typeof value !== 'string') throw new Error(`${name} must be a string`)
  const clean = value.trim()
  if (!clean || clean.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(clean)) {
    throw new Error(`${name} is invalid`)
  }
  return clean
}

function oneOf<T extends string>(value: unknown, name: string, values: readonly T[]): T {
  if (typeof value !== 'string' || !values.includes(value as T)) throw new Error(`${name} is invalid`)
  return value as T
}

function uuid(value: unknown, name: string): string {
  const result = text(value, name, 36)
  if (!result || !UUID.test(result)) throw new Error(`${name} must be a UUID`)
  return result
}

function isoDateTime(value: unknown, name: string): string {
  const result = text(value, name, 40)
  if (!result || Number.isNaN(Date.parse(result))) throw new Error(`${name} must be an ISO date-time`)
  return result
}

function base(body: Record<string, unknown>) {
  return {
    conversationId: uuid(body.conversationId, 'conversationId'),
    correlationId: text(body.correlationId, 'correlationId', 100)!,
    toolInvocationId: text(body.toolInvocationId, 'toolInvocationId', 100, false),
  }
}

export function parseOperationInput(operationValue: string, body: unknown): OperationInput {
  if (!WEBSITE_ASSISTANT_OPERATIONS.includes(operationValue as WebsiteAssistantOperation)) throw new Error('Unknown operation')
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('JSON object required')
  const value = body as Record<string, unknown>
  const common = base(value)
  const operation = operationValue as WebsiteAssistantOperation

  switch (operation) {
    case 'create_or_update_website_lead': {
      const email = text(value.email, 'email', 254, false)?.toLowerCase()
      const phone = text(value.phone, 'phone', 32, false)
      if (!email && !phone) throw new Error('email or phone is required')
      if (email && !EMAIL.test(email)) throw new Error('email is invalid')
      const normalizedPhone = phone ? normalizePhone(phone) : undefined
      if (phone && !normalizedPhone) throw new Error('phone must be a US number with an explicit or assumed +1 country code')
      if (!Array.isArray(value.consents)) throw new Error('consents must be an array')
      const consents = value.consents.map((item) => parseConsent(item))
      if (!consents.some((item) => item.type === 'privacy' && item.status === 'granted')) {
        throw new Error('privacy consent is required')
      }
      return {
        operation: 'create_or_update_website_lead',
        ...common,
        firstName: text(value.firstName, 'firstName', 80)!,
        lastName: text(value.lastName, 'lastName', 100, false),
        email,
        phone: normalizedPhone ?? undefined,
        leadIntent: oneOf(value.leadIntent, 'leadIntent', ['purchase', 'refinance', 'investment', 'information', 'other'] as const),
        timeline: value.timeline == null ? undefined : oneOf(value.timeline, 'timeline', ['within_30_days', '31_to_90_days', 'more_than_90_days', 'unsure'] as const),
        preferredContact: value.preferredContact == null ? undefined : oneOf(value.preferredContact, 'preferredContact', ['email', 'phone', 'text'] as const),
        sourcePage: text(value.sourcePage, 'sourcePage', 500, false),
        consents,
      }
    }
    case 'create_follow_up_task':
      return {
        operation: 'create_follow_up_task',
        ...common,
        contactId: uuid(value.contactId, 'contactId'),
        reason: text(value.reason, 'reason', 500)!,
        dueAt: isoDateTime(value.dueAt, 'dueAt'),
        priority: oneOf(value.priority, 'priority', ['low', 'normal', 'high', 'urgent'] as const),
      }
    case 'send_application_link':
      return {
        operation: 'send_application_link',
        ...common,
        contactId: value.contactId == null ? undefined : uuid(value.contactId, 'contactId'),
        delivery: oneOf(value.delivery, 'delivery', ['chat', 'email', 'text'] as const),
        consentPolicyVersion: text(value.consentPolicyVersion, 'consentPolicyVersion', 80, false),
      }
    case 'get_available_call_times': {
      const dateFrom = text(value.dateFrom, 'dateFrom', 10)!
      const dateTo = text(value.dateTo, 'dateTo', 10)!
      if (!DATE.test(dateFrom) || !DATE.test(dateTo) || dateFrom > dateTo) throw new Error('date range is invalid')
      return { operation: 'get_available_call_times', ...common, timezone: text(value.timezone, 'timezone', 80)!, dateFrom, dateTo }
    }
    case 'schedule_consultation': {
      const visitorEmail = text(value.visitorEmail, 'visitorEmail', 254, false)?.toLowerCase()
      const visitorPhone = text(value.visitorPhone, 'visitorPhone', 32, false)
      if (visitorEmail && !EMAIL.test(visitorEmail)) throw new Error('visitorEmail is invalid')
      return {
        operation: 'schedule_consultation',
        ...common,
        contactId: value.contactId == null ? undefined : uuid(value.contactId, 'contactId'),
        startAt: isoDateTime(value.startAt, 'startAt'),
        timezone: text(value.timezone, 'timezone', 80)!,
        visitorName: text(value.visitorName, 'visitorName', 180)!,
        visitorEmail,
        visitorPhone: visitorPhone ? normalizePhone(visitorPhone) ?? undefined : undefined,
        consentPolicyVersion: text(value.consentPolicyVersion, 'consentPolicyVersion', 80, false),
      }
    }
    case 'escalate_to_adam':
      return {
        operation: 'escalate_to_adam',
        ...common,
        contactId: value.contactId == null ? undefined : uuid(value.contactId, 'contactId'),
        reason: oneOf(value.reason, 'reason', ['human_requested', 'unsupported', 'complaint', 'fair_lending', 'accessibility', 'sensitive_data', 'urgent', 'failed_operation', 'licensed_advice', 'repeated_failure'] as const),
        safeSummary: text(value.safeSummary, 'safeSummary', 1000)!,
      }
    case 'record_conversation_turn': {
      if (!Array.isArray(value.sourceRefs) || !value.sourceRefs.every((item) => typeof item === 'string' && item.length <= 200)) throw new Error('sourceRefs is invalid')
      if (!value.policyOutcome || typeof value.policyOutcome !== 'object' || Array.isArray(value.policyOutcome)) throw new Error('policyOutcome is invalid')
      if (!Number.isInteger(value.sequenceStart) || Number(value.sequenceStart) < 1) throw new Error('sequenceStart is invalid')
      return {
        operation: 'record_conversation_turn',
        ...common,
        sessionHash: text(value.sessionHash, 'sessionHash', 128)!,
        visitorMessage: text(value.visitorMessage, 'visitorMessage', 4000)!,
        assistantMessage: text(value.assistantMessage, 'assistantMessage', 6000)!,
        sequenceStart: Number(value.sequenceStart),
        knowledgeVersion: text(value.knowledgeVersion, 'knowledgeVersion', 128, false),
        sourceRefs: value.sourceRefs as string[],
        policyOutcome: value.policyOutcome as Record<string, boolean | string | number>,
        modelRequestId: text(value.modelRequestId, 'modelRequestId', 128, false),
      }
    }
  }
}

function parseConsent(value: unknown): ConsentEvidence {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('consent item is invalid')
  const item = value as Record<string, unknown>
  return {
    type: oneOf(item.type, 'consent.type', ['privacy', 'email', 'sms'] as const),
    status: oneOf(item.status, 'consent.status', ['granted', 'denied', 'withdrawn', 'not_requested'] as const),
    policyVersion: text(item.policyVersion, 'consent.policyVersion', 80)!,
    wordingHash: text(item.wordingHash, 'consent.wordingHash', 128, false),
    consentedAt: item.consentedAt == null ? undefined : isoDateTime(item.consentedAt, 'consent.consentedAt'),
  }
}

export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`
  if (value.trim().startsWith('+') && E164.test(`+${digits}`)) return `+${digits}`
  return null
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}
