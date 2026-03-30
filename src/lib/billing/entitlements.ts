/**
 * Feature entitlement check — stub until Stripe billing is built.
 * Returns true if the org's plan includes the requested feature.
 */
export function canAccessFeature(feature: string, plan: string): boolean {
  const professionalFeatures = [
    'customBranding',
    'customDomain',
    'customEmailReplyTo',
    'advancedReporting',
  ]

  if (plan === 'professional') {
    return professionalFeatures.includes(feature)
  }

  // Starter plan — no premium features
  return false
}
