import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Returns an Anthropic client using the API key from:
 * 1. ANTHROPIC_API_KEY environment variable (Vercel env)
 * 2. user_settings table, key = 'integrations' (Settings → Integrations)
 *
 * Throws a descriptive error if neither is set.
 */
export async function getAnthropicClient(): Promise<Anthropic> {
  if (process.env.ANTHROPIC_API_KEY) {
    return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('user_settings')
    .select('value')
    .eq('key', 'integrations')
    .limit(1)
    .maybeSingle()

  const key = (data?.value as { anthropic_api_key?: string } | null)?.anthropic_api_key
  if (key) return new Anthropic({ apiKey: key })

  throw new Error(
    'Anthropic API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables, or go to Settings → Integrations and save your API key.'
  )
}
