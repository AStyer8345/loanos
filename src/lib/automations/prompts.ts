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
  /** Fields extracted from uploaded PDF — available only for pdf-trigger automations */
  extractedFields?: Record<string, string | number | null>
  orgName: string
  loName: string
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

function loanAmountStr(amount: number | null | undefined): string {
  if (!amount) return 'your loan'
  return `$${Number(amount).toLocaleString()}`
}

function propertyStr(loan?: AutomationRecord['loan']): string {
  if (!loan) return 'the property'
  const parts = [loan.property_address, loan.property_city, loan.property_state].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'the property'
}

/** Format extracted field value for prompt injection */
function ext(fields: Record<string, string | number | null> | undefined, key: string, fallback = ''): string {
  if (!fields || fields[key] == null) return fallback
  return String(fields[key])
}

// ── Per-automation prompt instructions ───────────────────────────────────────

const AUTOMATION_INSTRUCTIONS: Record<string, (r: AutomationRecord) => string> = {
  'referral-thank-you': (r) =>
    `Write a quick thank-you to the referring agent (${contactName(r.referralContact || r.agentContact)}) for sending ${contactName(r.contact)} our way. Keep it to 3-4 sentences. Genuine appreciation, not over-the-top.`,

  'referral-intro': (r) =>
    `Write a warm welcome email to ${firstName(r.contact)} who was referred to us${r.referralContact ? ` by ${contactName(r.referralContact)}` : ''}. Introduce yourself briefly, mention you'd love to help with their home financing, and suggest a quick call. 4-5 sentences.`,

  'application-link': (r) =>
    `Write a short email to ${firstName(r.contact)} with a link to start their loan application. The link is: https://mslp.my1003app.com/513013/register — make it feel casual, not pushy. 3-4 sentences. Mention you're here if they have questions while filling it out.`,

  'nurture-followup': (r) =>
    `Write a casual check-in email to ${firstName(r.contact)}. Don't be salesy — just checking in to see if they're still thinking about buying/refinancing and if there's anything you can help with. 3-4 sentences max. Light, conversational.`,

  'app-received': (r) => {
    const f = r.extractedFields
    if (f) {
      return `Write a confirmation email to ${ext(f, 'borrower_first_name') || firstName(r.contact)} that we received their loan application. Use these extracted details naturally:
- Loan amount: ${ext(f, 'loan_amount', 'not specified')}
- Property: ${ext(f, 'property_address', 'not specified')}
- Loan program: ${ext(f, 'loan_program', 'not specified')}
Let them know what happens next (we'll review and reach out with any questions or doc requests). Reassuring tone. 4-5 sentences.`
    }
    return `Write a confirmation email to ${firstName(r.contact)} that we received their loan application${r.loan?.loan_amount ? ` for ${loanAmountStr(r.loan.loan_amount)}` : ''}. Let them know what happens next (we'll review and reach out with any questions or doc requests). Reassuring tone. 4-5 sentences.`
  },

  'doc-request': (r) =>
    `Write an email to ${firstName(r.contact)} requesting documents we need to move forward with their ${r.loan?.loan_purpose || 'loan'}. Ask for: last 2 years tax returns, recent pay stubs, 2 months bank statements, and a valid photo ID. Keep it friendly and organized but in paragraph form, not a list. Mention they can reply to this email or upload securely. 5-6 sentences.`,

  'pre-approval-email': (r) => {
    const f = r.extractedFields
    if (f) {
      return `Write a congratulations email to ${ext(f, 'borrower_first_name') || firstName(r.contact)} — they're pre-approved! Use these extracted details from the PA letter:
- Pre-approved amount: ${ext(f, 'loan_amount', 'not specified')}
- Interest rate: ${ext(f, 'interest_rate', 'not specified')}%
- Loan program: ${ext(f, 'loan_program', 'not specified')}
- Expiry date: ${ext(f, 'pre_approval_expiry_date', 'not specified')}
${ext(f, 'property_address') ? `- Property: ${ext(f, 'property_address')}` : ''}
Celebrate the milestone, explain what pre-approval means (they can make offers with confidence), and mention the PA letter is attached. Warm and exciting. 5-6 sentences.`
    }
    return `Write a congratulations email to ${firstName(r.contact)} — they're pre-approved${r.loan?.loan_amount ? ` for up to ${loanAmountStr(r.loan.loan_amount)}` : ''}. Celebrate the milestone, explain what pre-approval means (they can make offers with confidence), and mention next steps. Warm and exciting. 5-6 sentences.`
  },

  'pre-approval-agent': (r) =>
    `Write a professional email to the buyer's agent (${contactName(r.agentContact)}) letting them know that ${contactName(r.contact)} has been pre-approved${r.loan?.loan_amount ? ` for up to ${loanAmountStr(r.loan.loan_amount)}` : ''}. Keep it brief and professional — agent-to-agent tone. Offer to provide a PA letter for any property they want to write on. 3-4 sentences.`,

  'processing-update': (r) =>
    `Write a status update email to ${firstName(r.contact)} letting them know their ${r.loan?.loan_purpose || 'loan'} is moving through processing. Reassure them everything is on track${r.loan?.closing_date ? ` and we're targeting a ${r.loan.closing_date} closing` : ''}. Mention you'll be in touch if we need anything else. 4-5 sentences.`,

  'conditional-approval': (r) =>
    `Write an email to ${firstName(r.contact)} — their loan has been approved with conditions! Explain this means the underwriter approved the loan but needs a few more items before final sign-off. Don't list specific conditions (those vary). Reassuring, positive tone — this is great news. 4-5 sentences.`,

  'cd-email': (r) => {
    const f = r.extractedFields
    if (f) {
      return `Write an email to ${ext(f, 'borrower_first_name') || firstName(r.contact)} walking them through their Closing Disclosure. Use these extracted details:
- Closing date: ${ext(f, 'closing_date', 'TBD')}
- Loan amount: ${ext(f, 'loan_amount', 'not specified')}
- Interest rate: ${ext(f, 'interest_rate', 'not specified')}%
- Monthly payment: ${ext(f, 'monthly_payment', 'not specified')}
- Cash to close: ${ext(f, 'cash_to_close', 'not specified')}
${ext(f, 'seller_credits') ? `- Seller credits: ${ext(f, 'seller_credits')}` : ''}
${ext(f, 'first_payment_date') ? `- First payment date: ${ext(f, 'first_payment_date')}` : ''}
Remind them to review the numbers carefully and reach out with questions. They have 3 business days to review before closing. 5-6 sentences.`
    }
    return `Write an email to ${firstName(r.contact)} walking them through what the Closing Disclosure means. ${r.loan?.closing_date ? `Mention the closing date (${r.loan.closing_date}) if available.` : ''} Remind them to review the numbers carefully and reach out with any questions. They have 3 business days to review before closing. 5-6 sentences.`
  },

  'contract-received': (r) => {
    const f = r.extractedFields
    if (f) {
      return `Write an email to ${ext(f, 'buyer_name') || firstName(r.contact)} confirming we received the executed purchase contract. Use these extracted details:
- Property: ${ext(f, 'property_address', 'not specified')}
- Sales price: ${ext(f, 'sales_price', 'not specified')}
- Closing date: ${ext(f, 'closing_date', 'not specified')}
${ext(f, 'option_period_end') ? `- Option period ends: ${ext(f, 'option_period_end')}` : ''}
${ext(f, 'earnest_money') ? `- Earnest money: ${ext(f, 'earnest_money')}` : ''}
Let them know we're moving forward — we'll order the appraisal and get disclosures out. Mention any time-sensitive items. Warm, action-oriented. 5-6 sentences.`
    }
    return `Write an email to ${firstName(r.contact)} confirming we received the executed purchase contract${r.loan?.property_address ? ` for ${propertyStr(r.loan)}` : ''}. Let them know we're moving forward — we'll order the appraisal and get disclosures out. 4-5 sentences.`
  },

  'closing-prep': (r) =>
    `Write an email to ${firstName(r.contact)} about what to expect at closing and what to bring: valid photo ID, cashier's check or wire confirmation for cash to close, and nothing else (we handle the rest). ${r.loan?.closing_date ? `Closing is scheduled for ${r.loan.closing_date}.` : ''} Congratulatory but practical. 5-6 sentences.`,

  'thank-you': (r) =>
    `Write a heartfelt thank-you email to ${firstName(r.contact)} now that their loan has funded and they're officially in their ${r.loan?.loan_purpose === 'Refinance' ? 'new loan' : 'new home'}${r.loan?.property_address ? ` at ${propertyStr(r.loan)}` : ''}. Genuine gratitude for trusting you. Mention you're always here if they need anything in the future. 4-5 sentences.`,

  'review-request': (r) =>
    `Write a personal ask to ${firstName(r.contact)} for a Google or Zillow review. Not pushy at all — mention how much their experience meant to you and that a review helps other families find trustworthy help. Include that a simple few sentences about their experience is more than enough. 3-4 sentences max.`,
}

// ── PDF extraction prompts per automation ────────────────────────────────────

export const EXTRACTION_PROMPTS: Record<string, string> = {
  'pre-approval-email': `Extract fields from this Pre-Approval letter. Return ONLY valid JSON:
{
  "borrower_first_name": "string",
  "borrower_last_name": "string",
  "loan_amount": number (no commas/dollar signs),
  "interest_rate": number (e.g. 6.875),
  "loan_program": "string (e.g. Conventional 30yr Fixed, FHA, VA)",
  "pre_approval_expiry_date": "string (MM/DD/YYYY format)",
  "property_address": "string or null if not specified",
  "down_payment_pct": number or null
}
Return ONLY the JSON object. No explanation, no markdown, no code fences.`,

  'cd-email': `Extract fields from this Closing Disclosure. Return ONLY valid JSON:
{
  "borrower_first_name": "string",
  "borrower_last_name": "string",
  "closing_date": "string (MM/DD/YYYY)",
  "loan_amount": number (no commas/dollar signs),
  "interest_rate": number (e.g. 6.875),
  "monthly_payment": number (P&I only, no commas/dollar signs),
  "cash_to_close": number (net cash to close, no commas/dollar signs),
  "seller_credits": number or null,
  "first_payment_date": "string (MM/DD/YYYY) or null",
  "property_address": "string"
}
Return ONLY the JSON object. No explanation, no markdown, no code fences.`,

  'app-received': `Extract fields from this loan application (1003). Return ONLY valid JSON:
{
  "borrower_first_name": "string",
  "borrower_last_name": "string",
  "co_borrower_first_name": "string or null",
  "co_borrower_last_name": "string or null",
  "loan_amount": number (no commas/dollar signs),
  "property_address": "string or null",
  "property_city": "string or null",
  "property_state": "string or null",
  "loan_purpose": "string (Purchase, Refinance, etc.)",
  "loan_program": "string (Conventional, FHA, VA, etc.) or null",
  "borrower_email": "string or null",
  "borrower_phone": "string or null"
}
Return ONLY the JSON object. No explanation, no markdown, no code fences.`,

  'contract-received': `Extract fields from this executed purchase contract (TREC or similar). Return ONLY valid JSON:
{
  "buyer_name": "string",
  "seller_name": "string or null",
  "property_address": "string",
  "sales_price": number (no commas/dollar signs),
  "closing_date": "string (MM/DD/YYYY)",
  "earnest_money": number or null,
  "option_period_end": "string (MM/DD/YYYY) or null",
  "option_fee": number or null,
  "title_company": "string or null",
  "listing_agent_name": "string or null",
  "listing_agent_email": "string or null",
  "buyer_agent_name": "string or null"
}
Return ONLY the JSON object. No explanation, no markdown, no code fences.`,
}

// ── Main prompt builder ──────────────────────────────────────────────────────

export function buildAutomationPrompt(
  automationId: string,
  record: AutomationRecord,
): { system: string; userMessage: string } {
  const loFirst = loFirstName(record.loName)

  const system = `${VOICE_SYSTEM}

You are writing on behalf of ${record.loName} at ${record.orgName}.
Sign off as "${loFirst}" — nothing else after the sign-off.`

  const instructionFn = AUTOMATION_INSTRUCTIONS[automationId]
  const userMessage = instructionFn
    ? instructionFn(record)
    : `Write a professional email for the "${automationId}" automation. Use available record data naturally.`

  return { system, userMessage }
}
