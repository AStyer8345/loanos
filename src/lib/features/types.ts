/**
 * Client-safe types and constants for org feature flags.
 * No server-only imports — safe to use in `'use client'` components.
 *
 * Server-only flag reader lives in `./getOrgFeatures.ts`.
 */

export type OrgFeatures = {
  drip_campaigns: boolean
  email_intelligence: boolean
  rate_watch: boolean
  marketing: boolean
  social_media: boolean
  lender_knowledge: boolean
  analytics: boolean
  scenarios: boolean
  automations: boolean
}

export const ALL_FEATURE_KEYS: ReadonlyArray<keyof OrgFeatures> = [
  'drip_campaigns',
  'email_intelligence',
  'rate_watch',
  'marketing',
  'social_media',
  'lender_knowledge',
  'analytics',
  'scenarios',
  'automations',
] as const

export const DEFAULT_FEATURES: OrgFeatures = {
  drip_campaigns: true,
  email_intelligence: true,
  rate_watch: true,
  marketing: true,
  social_media: true,
  lender_knowledge: true,
  analytics: true,
  scenarios: true,
  automations: true,
}
