export interface AutomationRecord {
  contact?: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone_mobile: string | null
  }
  loan?: {
    loan_amount: number | null
    interest_rate: number | null
    closing_date: string | null
    property_address: string | null
    property_city: string | null
    property_state: string | null
    loan_type: string | null
    loan_purpose: string | null
    status: string | null
  }
  agentContact?: {
    first_name: string | null
    last_name: string | null
    email: string | null
  }
  referralContact?: {
    first_name: string | null
    last_name: string | null
    email: string | null
  }
  orgName: string
  loName: string
  applicationLink?: string | null
}

const VOICE_SYSTEM = `You are a mortgage loan officer writing a personal email.
Tone: trusted advisor, not salesperson. Direct. Warm but not sappy.
Write like a real person — short sentences, conversational.
Never "I hope this email finds you well."
No bullet points in email body — flowing paragraphs.
Plain text only — no HTML, no markdown formatting.
Sign off as the LO's first name only — NMLS is in the email signature, NOT in the body.
Return ONLY valid JSON: { "subject": "...", "body": "..." }
Max 6 sentences in body unless the automation specifically needs more.
Use record data naturally — don't force every field into the email.
Safe fallbacks: use "there" if no first name, "your loan" if no amount, etc.`

function contactName(c?: { first_name: string | null; last_name: string | null } | null): string {
  if (!c) return 'there'
  const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
  return name || 'there'
}

function firstName(c?: { first_name: string | null } | null): string {
  return c?.first_name?.trim() || 'there'
}

function loFirstName(loName: string): string {
  return loName.split(' ')[0] || loName
}

function loanAmountStr(amount: number | null): string {
  if (!amount) return 'your loan'
  return `$${amount.toLocaleString()}`
}

function propertyStr(loan?: AutomationRecord['loan']): string {
  if (!loan) return 'the property'
  const parts = [loan.property_address, loan.property_city, loan.property_state].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'the property'
}

// ── Per-automation prompt instructions ───────────────────────────────────────

const AUTOMATION_INSTRUCTIONS: Record<string, (r: AutomationRecord) => string> = {
  'referral-thank-you': (r) =>
    `Write a quick thank-you to the referring agent (${contactName(r.referralContact || r.agentContact)}) for sending ${contactName(r.contact)} our way. Keep it to 3-4 sentences. Genuine appreciation, not over-the-top.`,

  'referral-intro': (r) =>
    `Write a warm welcome email to ${firstName(r.contact)} who was referred to us${r.referralContact ? ` by ${contactName(r.referralContact)}` : ''}. Introduce yourself briefly, mention you'd love to help with their home financing, and suggest a quick call. 4-5 sentences.`,

  'application-link': (r) =>
    `Write a short email to ${firstName(r.contact)} with a link to start their loan application. The link is: ${r.applicationLink || 'your application link'} — make it feel casual, not pushy. 3-4 sentences. Mention you're here if they have questions while filling it out.`,

  'nurture-followup': (r) =>
    `Write a casual check-in email to ${firstName(r.contact)}. Don't be salesy — just checking in to see if they're still thinking about buying/refinancing and if there's anything you can help with. 3-4 sentences max. Light, conversational.`,

  'app-received': (r) =>
    `Write a confirmation email to ${firstName(r.contact)} that we received their loan application${r.loan?.loan_amount ? ` for ${loanAmountStr(r.loan.loan_amount)}` : ''}. Let them know what happens next (we'll review and reach out with any questions or doc requests). Reassuring tone. 4-5 sentences.`,

  'doc-request': (r) =>
    `Write an email to ${firstName(r.contact)} requesting documents we need to move forward with their ${r.loan?.loan_purpose || 'loan'}. Ask for: last 2 years tax returns, recent pay stubs, 2 months bank statements, and a valid photo ID. Keep it friendly and organized but in paragraph form, not a list. Mention they can reply to this email or upload securely. 5-6 sentences.`,

  'pre-approval-email': (r) =>
    `Write a congratulations email to ${firstName(r.contact)} — they're pre-approved${r.loan?.loan_amount ? ` for up to ${loanAmountStr(r.loan.loan_amount)}` : ''}. Celebrate the milestone, explain what pre-approval means (they can make offers with confidence), and mention next steps. Warm and exciting. 5-6 sentences.`,

  'pre-approval-agent': (r) =>
    `Write a professional email to the buyer's agent (${contactName(r.agentContact)}) letting them know that ${contactName(r.contact)} has been pre-approved${r.loan?.loan_amount ? ` for up to ${loanAmountStr(r.loan.loan_amount)}` : ''}. Keep it brief and professional — agent-to-agent tone. Offer to provide a PA letter for any property they want to write on. 3-4 sentences.`,

  'processing-update': (r) =>
    `Write a status update email to ${firstName(r.contact)} letting them know their ${r.loan?.loan_purpose || 'loan'} is moving through processing. Reassure them everything is on track${r.loan?.closing_date ? ` and we're targeting a ${r.loan.closing_date} closing` : ''}. Mention you'll be in touch if we need anything else. 4-5 sentences.`,

  'conditional-approval': (r) =>
    `Write an email to ${firstName(r.contact)} — their loan has been approved with conditions! Explain this means the underwriter approved the loan but needs a few more items before final sign-off. Don't list specific conditions (those vary). Reassuring, positive tone — this is great news. 4-5 sentences.`,

  'cd-email': (r) =>
    `Write an email to ${firstName(r.contact)} walking them through what the Closing Disclosure means. ${r.loan?.closing_date ? `Mention the closing date (${r.loan.closing_date}) if available.` : ''} Remind them to review the numbers carefully and reach out with any questions. They have 3 business days to review before closing. 5-6 sentences.`,

  'closing-prep': (r) =>
    `Write an email to ${firstName(r.contact)} about what to expect at closing and what to bring: valid photo ID, cashier's check or wire confirmation for cash to close, and nothing else (we handle the rest). ${r.loan?.closing_date ? `Closing is scheduled for ${r.loan.closing_date}.` : ''} Congratulatory but practical. 5-6 sentences.`,

  'thank-you': (r) =>
    `Write a heartfelt thank-you email to ${firstName(r.contact)} now that their loan has funded and they're officially in their ${r.loan?.loan_purpose === 'Refinance' ? 'new loan' : 'new home'}${r.loan?.property_address ? ` at ${propertyStr(r.loan)}` : ''}. Genuine gratitude for trusting you. Mention you're always here if they need anything in the future. 4-5 sentences.`,

  'review-request': (r) =>
    `Write a personal ask to ${firstName(r.contact)} for a Google or Zillow review. Not pushy at all — mention how much their experience meant to you and that a review helps other families find trustworthy help. Include that a simple few sentences about their experience is more than enough. 3-4 sentences max.`,
}

// ── Main prompt builder ──────────────────────────────────────────────────────

export function buildAutomationPrompt(
  automationId: string,
  record: AutomationRecord,
  voiceGuide?: string,
  voiceFeedback?: string,
): { system: string; userMessage: string } {
  const loFirst = loFirstName(record.loName)

  // If a voice guide is available, use it as the primary voice authority
  const voiceBlock = voiceGuide
    ? `## Voice Guide (PRIMARY — follow this exactly)
${voiceGuide}

## Voice Feedback (patterns from past edits — do not repeat mistakes)
${voiceFeedback || 'No feedback yet.'}

## Baseline Rules
${VOICE_SYSTEM}`
    : VOICE_SYSTEM

  const system = `${voiceBlock}

You are writing on behalf of ${record.loName} at ${record.orgName}.
Sign off as "${loFirst}" — nothing else after the sign-off.`

  const instructionFn = AUTOMATION_INSTRUCTIONS[automationId]
  const userMessage = instructionFn
    ? instructionFn(record)
    : `Write a professional email for the "${automationId}" automation. Use available record data naturally.`

  return { system, userMessage }
}
