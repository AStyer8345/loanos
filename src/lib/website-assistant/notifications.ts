import { sendEmail } from '@/lib/email/sendEmail'

type LeadNotificationInput = {
  organizationId: string
  contactId: string
  conversationId: string
  firstName: string
  lastName?: string
  email?: string
  phone?: string
  leadIntent: string
  timeline?: string
  sourcePage?: string
  conversationSummary?: string
}

export type LeadNotificationResult = {
  ownerNotified: boolean
  visitorAcknowledged: boolean
}

type ConversationStartedNotificationInput = {
  organizationId: string
  conversationId: string
  firstQuestion: string
  sourcePage?: string
}

export async function sendWebsiteAssistantConversationStartedNotification(
  input: ConversationStartedNotificationInput
): Promise<boolean> {
  const appBase = getAppBase()
  const transcriptsUrl = `${appBase}/dashboard/assistant-conversations`
  const ownerEmail = getOwnerEmail()
  const questionPreview = input.firstQuestion.length > 72
    ? `${input.firstQuestion.slice(0, 69)}...`
    : input.firstQuestion

  try {
    await sendEmail({
      orgId: input.organizationId,
      to: ownerEmail,
      subject: `New website chat: ${questionPreview}`,
      body: `
        <div style="font-family:Arial,sans-serif;line-height:1.55;color:#172033;max-width:620px">
          <h2 style="margin:0 0 16px">A visitor started a website chat</h2>
          <p>This visitor is anonymous until they choose to share their contact information.</p>
          <p style="margin-bottom:6px"><strong>First question</strong></p>
          <div style="background:#f5f7fa;border-left:4px solid #0a1f3f;padding:12px 14px;margin:0 0 16px;white-space:pre-wrap">${html(input.firstQuestion)}</div>
          ${input.sourcePage ? `<p><strong>Page:</strong> ${html(input.sourcePage)}</p>` : ''}
          <p><strong>Conversation ID:</strong> ${html(input.conversationId)}</p>
          <p><a href="${html(transcriptsUrl)}" style="display:inline-block;background:#0a1f3f;color:#fff;text-decoration:none;padding:11px 16px;border-radius:6px">Open chat transcripts</a></p>
        </div>
      `,
      tags: { kind: 'website_assistant_chat_started', conversation_id: input.conversationId },
      log: { organizationId: input.organizationId, template: 'website_assistant_chat_started' },
    })
    return true
  } catch (error) {
    console.error('[website-assistant] conversation-start notification failed', safeError(error))
    return false
  }
}

export async function sendWebsiteAssistantLeadNotifications(input: LeadNotificationInput): Promise<LeadNotificationResult> {
  const name = [input.firstName, input.lastName].filter(Boolean).join(' ')
  const appBase = getAppBase()
  const contactUrl = `${appBase}/dashboard/contacts/${encodeURIComponent(input.contactId)}`
  const ownerEmail = getOwnerEmail()

  const ownerSend = sendEmail({
    orgId: input.organizationId,
    to: ownerEmail,
    subject: `Website assistant lead: ${name}`,
    body: `
      <div style="font-family:Arial,sans-serif;line-height:1.55;color:#172033;max-width:620px">
        <h2 style="margin:0 0 16px">New website assistant follow-up</h2>
        <p><strong>${html(name)}</strong> asked Adam to make contact.</p>
        <ul>
          ${input.email ? `<li>Email: ${html(input.email)}</li>` : ''}
          ${input.phone ? `<li>Phone: ${html(input.phone)}</li>` : ''}
          <li>Interest: ${html(label(input.leadIntent))}</li>
          ${input.timeline ? `<li>Timeline: ${html(label(input.timeline))}</li>` : ''}
          ${input.sourcePage ? `<li>Page: ${html(input.sourcePage)}</li>` : ''}
          ${input.conversationSummary ? `<li>Conversation summary: ${html(input.conversationSummary)}</li>` : ''}
        </ul>
        <p><a href="${html(contactUrl)}" style="display:inline-block;background:#0a1f3f;color:#fff;text-decoration:none;padding:11px 16px;border-radius:6px">Open contact and chat transcript</a></p>
      </div>
    `,
    tags: { kind: 'website_assistant_lead', contact_id: input.contactId },
    log: { organizationId: input.organizationId, contactId: input.contactId, template: 'website_assistant_lead' },
  })

  const visitorSend = input.email
    ? sendEmail({
        orgId: input.organizationId,
        to: input.email,
        subject: `We received your message, ${input.firstName}`,
        body: `
          <div style="font-family:Arial,sans-serif;line-height:1.55;color:#172033;max-width:620px">
            <p>Hi ${html(input.firstName)},</p>
            <p>Thanks for reaching out. Adam or someone on his team will contact you as soon as possible.</p>
            <p>If you’d like, you can also text Adam at <a href="sms:15129566010">(512) 956-6010</a>.</p>
            <p>— Adam Styer<br>NMLS #513013</p>
            <p style="font-size:12px;color:#687386">This confirms that your contact request was received. It is not a loan approval or commitment.</p>
          </div>
        `,
        tags: { kind: 'website_assistant_ack', contact_id: input.contactId },
        log: { organizationId: input.organizationId, contactId: input.contactId, template: 'website_assistant_ack' },
      })
    : Promise.resolve('')

  const [ownerResult, visitorResult] = await Promise.allSettled([ownerSend, visitorSend])
  if (ownerResult.status === 'rejected') console.error('[website-assistant] owner notification failed', safeError(ownerResult.reason))
  if (visitorResult.status === 'rejected') console.error('[website-assistant] visitor acknowledgment failed', safeError(visitorResult.reason))

  return {
    ownerNotified: ownerResult.status === 'fulfilled',
    visitorAcknowledged: !input.email || visitorResult.status === 'fulfilled',
  }
}

function getAppBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://loanos-astyer8345s-projects.vercel.app')
}

function getOwnerEmail(): string {
  return process.env.LOANOS_ADMIN_EMAIL?.trim() || 'styer.adam@gmail.com'
}

function html(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character)
}

function label(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function safeError(value: unknown): string {
  return value instanceof Error ? value.message.slice(0, 200) : 'unknown_error'
}
