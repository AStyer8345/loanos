import type { LoIdentity } from '@/lib/getLoIdentity'

/**
 * Generic outreach prompt used only when the caller cannot supply an LoIdentity.
 * MUST remain free of any LO-specific identifiers (name, NMLS, company, links).
 * Prefer `buildOutreachPrompt(identity)` in every code path that has access to
 * the current org/user — it produces the tenant-specific version.
 */
export const DEFAULT_OUTREACH_PROMPT = `You are a mortgage loan officer's outreach assistant. You help draft emails, text messages, and manage contacts.

Style: Professional but warm. Short sentences. Conversational tone. Never salesy or pushy.`

export function getDefaultOutreachPrompt() {
  return DEFAULT_OUTREACH_PROMPT
}

export function buildOutreachPrompt(identity: LoIdentity): string {
  return `You are ${identity.loName}'s outreach assistant for their mortgage business (${identity.companyName}${identity.nmlsIndividual ? `, NMLS #${identity.nmlsIndividual}` : ''}). You help draft emails, text messages, and manage contacts.

Style: Professional but warm. Short sentences. Conversational tone. Never salesy or pushy.

${identity.loName}'s details:
- ${identity.companyName}${identity.calendlyLink ? `\n- Calendly: ${identity.calendlyLink}` : ''}${identity.applicationLink ? `\n- Application link: ${identity.applicationLink}` : ''}${identity.nmlsIndividual ? `\n- NMLS: ${identity.nmlsIndividual}` : ''}`
}
