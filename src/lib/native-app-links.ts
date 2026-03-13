/**
 * Native App Links
 * Generates deep links for iMessage and mailto on macOS/iOS.
 */

/**
 * Generate an iMessage deep link for a single recipient.
 * Opens Messages.app with the body pre-filled.
 */
export function imessageLink(phone: string, body: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `sms:${cleaned}&body=${encodeURIComponent(body)}`
}

/**
 * Generate a mailto link with subject and body.
 * For single recipient — Outlook/Mail.app will open.
 */
export function mailtoLink(
  email: string,
  subject: string,
  body: string
): string {
  const params = new URLSearchParams({ subject, body })
  return `mailto:${email}?${params.toString()}`
}

/**
 * Generate a mailto link for multiple recipients.
 */
export function bulkMailtoLink(
  emails: string[],
  subject: string,
  body: string
): string {
  const to = emails.join(',')
  const params = new URLSearchParams({ subject, body })
  return `mailto:${to}?${params.toString()}`
}

/**
 * Generate a tel: link for calling.
 */
export function telLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  return `tel:${cleaned}`
}
