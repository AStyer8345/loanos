import { createServiceClient } from '@/lib/supabase/service'

/**
 * Fetch the voice guide and voice feedback from social_settings for an organization.
 * Returns both as strings, with safe fallbacks.
 */
export async function fetchVoiceGuide(organizationId: string): Promise<{
  voiceGuide: string
  voiceFeedback: string
}> {
  const supabase = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any

  const [{ data: guideRow }, { data: feedbackRow }] = await Promise.all([
    supabase
      .from('social_settings')
      .select('value')
      .eq('organization_id', organizationId)
      .eq('key', 'voice_guide')
      .maybeSingle(),
    supabase
      .from('social_settings')
      .select('value')
      .eq('organization_id', organizationId)
      .eq('key', 'voice_feedback')
      .maybeSingle(),
  ])

  return {
    voiceGuide: guideRow?.value || '',
    voiceFeedback: feedbackRow?.value || '',
  }
}
