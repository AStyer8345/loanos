// Simple sliding window rate limiter.
// In-memory store resets on cold start — acceptable for single-instance Vercel serverless.
// Upgrade to Upstash Redis if scaling to multi-region.
const requests = new Map<string, number[]>()

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const windowStart = now - windowMs
  const timestamps = (requests.get(key) ?? []).filter(t => t > windowStart)

  if (timestamps.length >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  timestamps.push(now)
  requests.set(key, timestamps)
  return { allowed: true, remaining: maxRequests - timestamps.length }
}
