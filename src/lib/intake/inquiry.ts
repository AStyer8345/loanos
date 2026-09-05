import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'crypto'

export const INTERNAL_EMAILS = new Set(['adam@thestyerteam.com', 'adam.styer@hypersmart.loan', 'adam.styerassistant@gmail.com'])
const value = (v: unknown, max = 1000) => typeof v === 'string' || typeof v === 'number' ? String(v).trim().slice(0, max) : ''
export function normalizeInquiry(raw: Record<string, unknown>) {
  const data = (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : raw) as Record<string, unknown>
  const email = value(data.email || raw.email, 254).toLowerCase()
  const phone = value(data.phone, 40)
  if ((!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && phone.replace(/\D/g, '').length < 10) throw new Error('A valid email or complete phone number is required')
  const key = value(data.inquiry_id || raw.inquiry_id || (raw.id ? `netlify:${raw.id}` : ''), 201)
  if (!/^[A-Za-z0-9:_-]{8,200}$/.test(key)) throw new Error('A stable inquiry_id is required')
  const isTest = data.test_mode === true || data.test_mode === 'true' || raw.test_mode === true
  if (isTest && !INTERNAL_EMAILS.has(email)) throw new Error('Test mode requires a verified internal mailbox')
  const names = value(data.name || raw.name, 180).split(/\s+/)
  const first_name = value(data.first_name || data['first-name'] || data.fname || raw.first_name || names[0], 100)
  const last_name = value(data.last_name || data['last-name'] || data.lname || raw.last_name || names.slice(1).join(' '), 100)
  const firstTouch = Object.fromEntries(Object.entries(data).filter(([k]) => k.startsWith('first_touch_')).map(([k,v]) => [k,value(v)]))
  const source_page = value(data.page_url || data.source_page || raw.site_url)
  const form_name = value(raw.form_name || data.form_name || data['form-name'], 120) || 'website'
  // These are source evidence. Server time is receipt time for new captures only.
  const occurred = value(raw.created_at || raw.received_at)
  const received_at = occurred && Number.isFinite(Date.parse(occurred)) && Date.parse(occurred) <= Date.now() + 60_000 ? new Date(occurred).toISOString() : new Date().toISOString()
  const input = { email, phone, first_name, last_name, source_page, form_name,
    parent_inquiry_id: value(data.parent_inquiry_id || raw.parent_inquiry_id, 200) || null,
    purpose: value(data.loan_goal || data.loanGoal || data.loan_type || data.loan_purpose, 200),
    source: value(data.first_touch_source || data.lead_source || data.source, 200) || 'Website',
    referral_partner: value(data.referred_by || data.referral_partner || data.partner_name, 200) || null,
    received_at, first_touch: firstTouch,
    provenance: { transport: raw.id ? 'netlify_form' : 'website_function', source_id: value(raw.id,200) || key },
    suppress_confirmation: ['qualification-followup','quick-quote-followup','notification-backup'].includes(form_name),
  }
  // Stable identity fields are common to both transports; additional source data
  // remains in the encrypted original. Reusing an ID for another person is held.
  const hash = createHash('sha256').update(JSON.stringify({email,phone:phone.replace(/\D/g,''),first_name:first_name.toLowerCase(),last_name:last_name.toLowerCase()})).digest('hex')
  return { key, input, isTest, hash, original: data }
}
export type CipherPayload = { ciphertext: string; iv: string; tag: string; version: number }
function encryptionKey() {
  const key = Buffer.from(process.env.PII_ENCRYPTION_KEY || '', 'hex')
  if (key.length !== 32) throw new Error('Inquiry encryption is unavailable')
  return key
}
export function encryptInquiry(payload: unknown): CipherPayload {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  return { ciphertext: Buffer.concat([cipher.update(JSON.stringify(payload),'utf8'),cipher.final()]).toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),version:1 }
}
export function decryptInquiry(payload: CipherPayload): Record<string, unknown> {
  if (payload.version !== 1) throw new Error('Unknown inquiry encryption version')
  const cipher = createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(payload.iv,'base64'))
  cipher.setAuthTag(Buffer.from(payload.tag,'base64'))
  return JSON.parse(Buffer.concat([cipher.update(Buffer.from(payload.ciphertext,'base64')),cipher.final()]).toString('utf8'))
}
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!))
