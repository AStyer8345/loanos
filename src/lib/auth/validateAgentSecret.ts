/**
 * Validates the Authorization: Bearer <LOANOS_AGENT_SECRET> header.
 * Returns a 401 Response if validation fails, or null if it passes.
 *
 * Usage:
 *   const authError = validateAgentSecret(request)
 *   if (authError) return authError
 */
export function validateAgentSecret(request: Request): Response | null {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.LOANOS_AGENT_SECRET

  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}
