import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { parseOperationInput, type OperationInput, type OperationResult, type WebsiteAssistantOperation } from '@/lib/website-assistant/contracts'
import { assertFreshTimestamp, canonicalRequest, parseSignatureHeaders, verifySignature } from '@/lib/website-assistant/signature'
import { redactObject, redactProhibited } from '@/lib/website-assistant/redaction'
import {
  sendWebsiteAssistantConversationStartedNotification,
  sendWebsiteAssistantLeadNotifications,
} from '@/lib/website-assistant/notifications'

export const runtime = 'nodejs'
export const maxDuration = 15

const JSON_HEADERS = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' }

function response(result: OperationResult, status = 200) {
  return NextResponse.json(result, { status, headers: JSON_HEADERS })
}

function fail(operation: WebsiteAssistantOperation, correlationId: string, code: string, message: string, status: number, retryable = false) {
  return response({ ok: false, operation, status: 'failed', correlationId, error: { code, message, retryable } }, status)
}

function env(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

export async function POST(request: NextRequest, context: { params: { operation: string } }) {
  const operation = context.params.operation as WebsiteAssistantOperation
  const pathname = new URL(request.url).pathname
  let rawBody = ''
  let correlationId = request.headers.get('x-correlation-id')?.slice(0, 100) || 'unknown'

  try {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > 32_000) return fail(operation, correlationId, 'request_too_large', 'Request is too large.', 413)
    if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
      return fail(operation, correlationId, 'unsupported_media_type', 'JSON is required.', 415)
    }

    rawBody = await request.text()
    if (Buffer.byteLength(rawBody, 'utf8') > 32_000) return fail(operation, correlationId, 'request_too_large', 'Request is too large.', 413)

    const signatureHeaders = parseSignatureHeaders(request)
    assertFreshTimestamp(signatureHeaders.timestamp)
    const expectedKeyId = env('WEBSITE_ASSISTANT_KEY_ID')
    if (signatureHeaders.keyId !== expectedKeyId) return fail(operation, correlationId, 'unauthorized', 'Unauthorized.', 401)
    const canonical = canonicalRequest(request.method, pathname, signatureHeaders, rawBody)
    if (!verifySignature(env('WEBSITE_ASSISTANT_SIGNING_SECRET'), canonical, signatureHeaders.signature)) {
      return fail(operation, correlationId, 'unauthorized', 'Unauthorized.', 401)
    }

    const parsedJson: unknown = JSON.parse(rawBody)
    const input = parseOperationInput(operation, parsedJson)
    correlationId = input.correlationId
    const organizationId = env('WEBSITE_ASSISTANT_ORG_ID')
    const ownerUserId = env('WEBSITE_ASSISTANT_OWNER_USER_ID')
    const supabase = createServiceClient()

    const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString()
    const { error: nonceError } = await supabase.from('website_service_nonces' as never).insert({
      key_id: signatureHeaders.keyId,
      nonce: signatureHeaders.nonce,
      expires_at: expiresAt,
    } as never)
    if (nonceError) {
      if (nonceError.code === '23505') {
        return fail(operation, correlationId, 'replayed_request', 'Request was already processed or replayed.', 409)
      }
      console.error('[website-assistant] nonce persistence failed', {
        operation,
        correlationId,
        code: nonceError.code,
        message: nonceError.message,
      })
      return fail(operation, correlationId, 'security_store_unavailable', 'The request security check is temporarily unavailable.', 503, true)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auditQuery = (supabase.from('ai_action_audit' as never) as any)
    const { data: prior } = await auditQuery
      .select('redacted_output')
      .eq('organization_id', organizationId)
      .eq('idempotency_key', signatureHeaders.idempotencyKey)
      .maybeSingle()
    if (prior?.redacted_output) return response(prior.redacted_output as OperationResult)

    const result = await executeOperation(supabase, organizationId, ownerUserId, input, signatureHeaders.idempotencyKey)
    await supabase.from('ai_action_audit' as never).insert({
      organization_id: organizationId,
      conversation_id: input.conversationId,
      contact_id: 'contactId' in input ? input.contactId ?? null : null,
      action: operation,
      outcome: result.status,
      correlation_id: input.correlationId,
      model_request_id: input.operation === 'record_conversation_turn' ? input.modelRequestId ?? null : null,
      tool_invocation_id: input.toolInvocationId ?? null,
      idempotency_key: signatureHeaders.idempotencyKey,
      redacted_input: redactObject(input),
      redacted_output: redactObject(result),
      policy_outcome: { schema_valid: true, signature_valid: true },
      retention_expires_at: new Date(Date.now() + 7 * 365 * 86_400_000).toISOString(),
    } as never)
    return response(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    const validation = /required|invalid|must be|Unknown operation|JSON/.test(message)
    if (!validation) console.error('[website-assistant] operation failed', { operation, correlationId, error: message })
    return fail(operation, correlationId, validation ? 'invalid_request' : 'operation_failed', validation ? message : 'The operation could not be completed.', validation ? 400 : 500, !validation)
  }
}

async function executeOperation(
  supabase: ReturnType<typeof createServiceClient>,
  organizationId: string,
  ownerUserId: string,
  input: OperationInput,
  idempotencyKey: string
): Promise<OperationResult> {
  const base = { ok: true, operation: input.operation, correlationId: input.correlationId }

  switch (input.operation) {
    case 'create_or_update_website_lead': {
      const email = input.email?.trim().toLowerCase() ?? null
      const phone = input.phone ?? null
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('upsert_website_assistant_lead', {
        p_organization_id: organizationId,
        p_user_id: ownerUserId,
        p_first_name: input.firstName,
        p_last_name: input.lastName ?? null,
        p_email: email,
        p_email_normalized: email,
        p_phone: phone,
        p_phone_e164: phone,
        p_lead_intent: input.leadIntent,
        p_timeline: input.timeline ?? null,
        p_source_page: input.sourcePage ?? null,
        p_conversation_id: input.conversationId,
      })
      if (error) throw new Error('Lead persistence failed')
      const result = data as { status: string; contact_id?: string; email_contact_id?: string; phone_contact_id?: string }
      if (result.status === 'conflict') {
        await createTask(supabase, organizationId, ownerUserId, {
          contactId: result.email_contact_id ?? result.phone_contact_id,
          reason: 'Website assistant duplicate conflict: normalized email and phone match different contacts.',
          dueAt: new Date().toISOString(),
          priority: 'urgent',
          sourceKey: `assistant-duplicate:${input.conversationId}`,
        })
        return { ...base, ok: false, status: 'conflict_review_required', data: { requiresHumanReview: true } }
      }
      for (const consent of input.consents) {
        await supabase.from('website_consents' as never).upsert({
          organization_id: organizationId,
          conversation_id: input.conversationId,
          contact_id: result.contact_id ?? null,
          consent_type: consent.type,
          status: consent.status,
          wording_hash: consent.wordingHash ?? null,
          policy_version: consent.policyVersion,
          source: 'website_chat',
          consented_at: consent.consentedAt ?? null,
        } as never, { onConflict: 'conversation_id,consent_type,policy_version' })
      }
      const task = await createTask(supabase, organizationId, ownerUserId, {
        contactId: result.contact_id,
        reason: `Contact ${input.firstName}${input.lastName ? ` ${input.lastName}` : ''} about their ${input.leadIntent} inquiry${input.timeline ? ` (${input.timeline.replace(/_/g, ' ')})` : ''}.${input.conversationSummary ? ` Chat summary: ${input.conversationSummary}` : ''}`,
        dueAt: new Date().toISOString(),
        priority: 'high',
        sourceKey: `assistant-followup:${input.conversationId}`,
      })
      const notifications = await sendWebsiteAssistantLeadNotifications({
        organizationId,
        contactId: result.contact_id!,
        conversationId: input.conversationId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        leadIntent: input.leadIntent,
        timeline: input.timeline,
        sourcePage: input.sourcePage,
        conversationSummary: input.conversationSummary,
      })
      return {
        ...base,
        status: result.status,
        data: {
          contactId: result.contact_id,
          duplicate: result.status === 'existing',
          followUpTaskId: task.id,
          ownerNotified: notifications.ownerNotified,
          visitorAcknowledged: notifications.visitorAcknowledged,
        },
      }
    }
    case 'create_follow_up_task': {
      const task = await createTask(supabase, organizationId, ownerUserId, {
        contactId: input.contactId,
        reason: input.reason,
        dueAt: input.dueAt,
        priority: input.priority,
        sourceKey: `assistant-task:${idempotencyKey}`,
      })
      return { ...base, status: task.created ? 'created' : 'existing', data: { taskId: task.id } }
    }
    case 'send_application_link': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('org_settings') as any)
        .select('application_link')
        .eq('organization_id', organizationId)
        .maybeSingle()
      if (!data?.application_link) return { ...base, ok: false, status: 'not_configured', error: { code: 'application_link_unavailable', message: 'The application link is not configured.', retryable: false } }
      if (input.delivery !== 'chat') {
        await createRecoveryTask(supabase, organizationId, ownerUserId, input.contactId, `Application link requested by ${input.delivery}; outbound delivery is disabled pending approval.`, idempotencyKey)
        return { ...base, ok: false, status: 'delivery_disabled', error: { code: 'delivery_disabled', message: 'I can show the application link here, but outbound delivery is not enabled.', retryable: false } }
      }
      await supabase.from('website_conversations' as never).update({ application_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() } as never).eq('id' as never, input.conversationId as never)
      return { ...base, status: 'display_only', data: { applicationUrl: data.application_link } }
    }
    case 'get_available_call_times': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase.from('org_settings') as any)
        .select('calendly_link')
        .eq('organization_id', organizationId)
        .maybeSingle()
      return {
        ...base,
        ok: false,
        status: 'provider_not_configured',
        data: data?.calendly_link ? { schedulingUrl: data.calendly_link, slots: [] } : { slots: [] },
        error: { code: 'availability_unavailable', message: 'Live availability is not configured yet.', retryable: false },
      }
    }
    case 'schedule_consultation': {
      await createRecoveryTask(supabase, organizationId, ownerUserId, input.contactId, `Scheduling requested for ${input.startAt}; scheduling provider is disabled pending staging approval.`, idempotencyKey)
      return { ...base, ok: false, status: 'provider_not_configured', error: { code: 'scheduling_unavailable', message: 'The appointment was not scheduled. A follow-up task was created instead.', retryable: false } }
    }
    case 'escalate_to_adam': {
      const task = await createTask(supabase, organizationId, ownerUserId, {
        contactId: input.contactId,
        reason: `[${input.reason}] ${input.safeSummary}`,
        dueAt: new Date().toISOString(),
        priority: ['complaint', 'fair_lending', 'urgent', 'sensitive_data', 'failed_operation'].includes(input.reason) ? 'urgent' : 'high',
        sourceKey: `assistant-escalation:${idempotencyKey}`,
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: escalation, error } = await (supabase.from('website_escalations' as never) as any).insert({
        organization_id: organizationId,
        conversation_id: input.conversationId,
        contact_id: input.contactId ?? null,
        task_id: task.id,
        reason: input.reason,
        safe_summary: input.safeSummary,
        status: 'open',
        intended_owner: 'adam',
      }).select('id').single()
      if (error) throw new Error('Escalation persistence failed')
      await supabase.from('website_conversations' as never).update({ status: 'escalated', escalation_reason: input.reason, escalation_status: 'open', updated_at: new Date().toISOString() } as never).eq('id' as never, input.conversationId as never)
      return { ...base, status: 'escalated', data: { escalationId: escalation.id, taskId: task.id, notified: true } }
    }
    case 'record_conversation_turn': {
      const visitor = redactProhibited(input.visitorMessage)
      const assistant = redactProhibited(input.assistantMessage)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversationTable = supabase.from('website_conversations' as never) as any
      const conversationValues = {
        organization_id: organizationId,
        public_session_hash: input.sessionHash,
        knowledge_version: input.knowledgeVersion ?? null,
        retention_expires_at: new Date(Date.now() + 2 * 365 * 86_400_000).toISOString(),
        updated_at: new Date().toISOString(),
      }
      // The browser can mint a new conversation id while the session cookie
      // (and its hash) stays the same. Upserting a new primary key onto the
      // unique (organization_id, public_session_hash) row fails once messages
      // reference the old id, so resolve the session's existing conversation
      // instead of rewriting its id.
      const { data: existingConversation, error: lookupError } = await conversationTable
        .select('id')
        .eq('organization_id', organizationId)
        .eq('public_session_hash', input.sessionHash)
        .maybeSingle()
      if (lookupError) throw new Error('Conversation lookup failed')
      const conversationId: string = existingConversation?.id ?? input.conversationId
      const { error: conversationError } = existingConversation
        ? await conversationTable.update(conversationValues).eq('id', conversationId)
        : await conversationTable.insert({ id: conversationId, ...conversationValues })
      if (conversationError) throw new Error('Conversation persistence failed')
      // Sequence numbers restart when a visitor opens a new tab in the same
      // session; append after the current maximum instead of overwriting.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lastMessage, error: sequenceError } = await (supabase.from('website_conversation_messages' as never) as any)
        .select('sequence_number')
        .eq('conversation_id', conversationId)
        .order('sequence_number', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (sequenceError) throw new Error('Conversation sequence lookup failed')
      const maxSequence: number = lastMessage?.sequence_number ?? 0
      const sequenceStart = input.sequenceStart > maxSequence ? input.sequenceStart : maxSequence + 1
      const { error: messageError } = await supabase.from('website_conversation_messages' as never).upsert([
        {
          organization_id: organizationId,
          conversation_id: conversationId,
          sequence_number: sequenceStart,
          role: 'visitor',
          redacted_text: visitor.text,
          policy_outcome: { ...input.policyOutcome, sensitive_detected: visitor.blocked, detected_types: visitor.detected },
          source_refs: [],
        },
        {
          organization_id: organizationId,
          conversation_id: conversationId,
          sequence_number: sequenceStart + 1,
          role: 'assistant',
          redacted_text: assistant.text,
          policy_outcome: input.policyOutcome,
          source_refs: input.sourceRefs,
        },
      ] as never, { onConflict: 'conversation_id,sequence_number' })
      if (messageError) throw new Error('Conversation message persistence failed')
      const conversationStartedNotified = maxSequence === 0
        ? await sendWebsiteAssistantConversationStartedNotification({
            organizationId,
            conversationId,
            firstQuestion: visitor.text,
            sourcePage: input.sourcePage,
          })
        : false
      return {
        ...base,
        status: 'recorded',
        data: {
          sensitiveInputDetected: visitor.blocked,
          conversationStartedNotified,
        },
      }
    }
  }
}

async function createTask(
  supabase: ReturnType<typeof createServiceClient>,
  organizationId: string,
  ownerUserId: string,
  input: { contactId?: string; reason: string; dueAt: string; priority: string; sourceKey: string }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = supabase.from('todo_items') as any
  const { data: existing } = await query.select('id').eq('organization_id', organizationId).eq('source_key', input.sourceKey).maybeSingle()
  if (existing) return { id: existing.id as string, created: false }
  // The public contract accepts 'normal', but todo_items' priority check
  // enumerates 'medium' for that tier.
  const priority = input.priority === 'normal' ? 'medium' : input.priority
  const { data, error } = await query.insert({
    organization_id: organizationId,
    user_id: ownerUserId,
    assigned_to: ownerUserId,
    related_contact_id: input.contactId ?? null,
    title: 'Website assistant follow-up',
    text: input.reason,
    description: input.reason,
    follow_up_reason: input.reason,
    due_at: input.dueAt,
    priority,
    is_urgent: priority === 'urgent',
    source: 'website_assistant',
    source_key: input.sourceKey,
    status: 'open',
  }).select('id').single()
  if (error || !data) throw new Error('Follow-up task creation failed')
  return { id: data.id as string, created: true }
}

async function createRecoveryTask(
  supabase: ReturnType<typeof createServiceClient>,
  organizationId: string,
  ownerUserId: string,
  contactId: string | undefined,
  reason: string,
  idempotencyKey: string
) {
  return createTask(supabase, organizationId, ownerUserId, {
    contactId,
    reason,
    dueAt: new Date().toISOString(),
    priority: 'high',
    sourceKey: `assistant-recovery:${createHash('sha256').update(idempotencyKey).digest('hex').slice(0, 32)}`,
  })
}
