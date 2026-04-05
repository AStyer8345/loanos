/**
 * Feature entitlement map for LoanOS pricing tiers.
 *
 * Tiers:
 *   - starter      ($97/mo) — basic CRM, loan pipeline view, scenario calculator, rate update emails
 *   - professional ($197/mo) — everything in starter plus automations, drip, chat agent, social, share pages
 *
 * Adding a new feature: put the feature key in the list below, then wrap the
 * route handler with `requirePlan('professional')` from './requirePlan.ts'.
 */

export type Plan = 'starter' | 'professional'

/**
 * Features that require the $197 professional tier.
 * Starter tier gets everything NOT in this list.
 */
export const PROFESSIONAL_FEATURES = [
  // Branding & customization
  'customBranding',
  'customDomain',
  'customEmailReplyTo',

  // Analytics & reporting
  'advancedReporting',

  // Automation & AI
  'dripCampaigns',
  'automationBuilder',
  'chatAgent',
  'dailyBriefing',

  // Marketing outputs
  'socialPublishing',
  'sharePageWrites',
  'scenarioSave',
  'scenarioPdf',

  // Team features
  'teamInvites',
] as const

export type ProfessionalFeature = typeof PROFESSIONAL_FEATURES[number]

/**
 * Returns true if the org's plan includes the requested feature.
 *
 * Starter gets everything not in PROFESSIONAL_FEATURES.
 * Professional gets everything.
 */
export function canAccessFeature(feature: string, plan: string): boolean {
  if (plan === 'professional') return true
  // Starter: only features NOT in the pro list
  return !PROFESSIONAL_FEATURES.includes(feature as ProfessionalFeature)
}

/**
 * Normalize a plan string from the DB into the canonical Plan type.
 * Treats any unknown value as 'starter' (fail closed).
 */
export function normalizePlan(plan: string | null | undefined): Plan {
  return plan === 'professional' ? 'professional' : 'starter'
}
