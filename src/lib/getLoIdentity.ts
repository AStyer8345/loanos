import { createServiceClient } from '@/lib/supabase/service'

/**
 * LO identity context — all fields needed for emails, prompts, PDFs, etc.
 * Used to replace hardcoded Adam references throughout the app.
 *
 * Two usage modes:
 *   1. Authenticated: pass organizationId from getOrganization()
 *   2. Service/webhook: pass organizationId resolved from slug or payload
 */
export interface LoIdentity {
  loName: string
  loFirstName: string
  loEmail: string
  loPhone: string
  nmlsIndividual: string
  companyName: string
  companyNmls: string
  brandColor: string
  logoUrl: string | null
  emailReplyTo: string | null
  applicationLink: string | null
  calendlyLink: string | null
  emailSignature: string | null
  slug: string | null
}

// Sensible defaults so emails never render blank if profile is incomplete
const FALLBACKS: LoIdentity = {
  loName: 'Your Loan Officer',
  loFirstName: 'Your LO',
  loEmail: '',
  loPhone: '',
  nmlsIndividual: '',
  companyName: '',
  companyNmls: '',
  brandColor: '#C9A84C',
  logoUrl: null,
  emailReplyTo: null,
  applicationLink: null,
  calendlyLink: null,
  emailSignature: null,
  slug: null,
}

/**
 * Fetch the LO identity for a given organization.
 *
 * Uses service client so it works in both authenticated and webhook contexts.
 * Queries profiles (owner first, then admin, then any member) + organizations + org_settings.
 */
export async function getLoIdentity(organizationId: string): Promise<LoIdentity> {
  const supabase = createServiceClient()

  // Fetch org, settings, and the primary LO profile in parallel
  const [orgRes, settingsRes, profileRes] = await Promise.all([
    supabase
      .from('organizations')
      .select('name, nmls, brand_color, logo_url, slug')
      .eq('id', organizationId)
      .single(),
    supabase
      .from('org_settings')
      .select('custom_email_reply_to, application_link, calendly_link')
      .eq('organization_id', organizationId)
      .maybeSingle(),
    // Get the owner's profile; fall back to admin, then any member
    supabase
      .from('profiles')
      .select('full_name, email, phone, nmls_individual, email_signature, role')
      .eq('organization_id', organizationId)
      .order('role', { ascending: true }) // 'admin' < 'member' < 'owner' — alpha sort puts owner last
      .limit(10),
  ])

  const org = orgRes.data
  const settings = settingsRes.data
  // Pick the owner first, then admin, then whoever
  const profiles = profileRes.data ?? []
  const profile =
    profiles.find((p) => p.role === 'owner') ??
    profiles.find((p) => p.role === 'admin') ??
    profiles[0] ??
    null

  const loName = profile?.full_name || FALLBACKS.loName
  // If loName is the fallback "Your Loan Officer", splitting gives "Your" — use the dedicated fallback instead
  const loFirstName = profile?.full_name ? loName.split(' ')[0] || FALLBACKS.loFirstName : FALLBACKS.loFirstName

  return {
    loName,
    loFirstName,
    loEmail: profile?.email || FALLBACKS.loEmail,
    loPhone: profile?.phone || FALLBACKS.loPhone,
    nmlsIndividual: profile?.nmls_individual || FALLBACKS.nmlsIndividual,
    companyName: org?.name || FALLBACKS.companyName,
    companyNmls: org?.nmls || FALLBACKS.companyNmls,
    brandColor: org?.brand_color || FALLBACKS.brandColor,
    logoUrl: org?.logo_url || FALLBACKS.logoUrl,
    emailReplyTo: settings?.custom_email_reply_to || FALLBACKS.emailReplyTo,
    applicationLink: settings?.application_link || FALLBACKS.applicationLink,
    calendlyLink: settings?.calendly_link || FALLBACKS.calendlyLink,
    emailSignature: profile?.email_signature || FALLBACKS.emailSignature,
    slug: org?.slug || FALLBACKS.slug,
  }
}
