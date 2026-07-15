const RULES: Array<{ type: string; pattern: RegExp }> = [
  { type: 'routing_number', pattern: /\b\d{9}\b/g },
  { type: 'ssn', pattern: /\b(?!000|666|9\d\d)\d{3}[- .]\d{2}[- .]\d{4}\b/g },
  { type: 'full_dob', pattern: /\b(?:0?[1-9]|1[0-2])[\/-](?:0?[1-9]|[12]\d|3[01])[\/-](?:19|20)\d{2}\b/g },
  { type: 'payment_card', pattern: /\b(?:\d[ -]*?){13,19}\b/g },
  { type: 'credential', pattern: /\b(?:password|passcode|one[- ]?time code|otp|authentication code|api key|secret)\s*[:=]\s*\S+/gi },
]

export type RedactionResult = { text: string; detected: string[]; blocked: boolean }

export function redactProhibited(value: string): RedactionResult {
  const detected = new Set<string>()
  let text = value
  for (const rule of RULES) {
    text = text.replace(rule.pattern, () => {
      detected.add(rule.type)
      return `[REDACTED_${rule.type.toUpperCase()}]`
    })
  }
  return { text, detected: [...detected], blocked: detected.size > 0 }
}

export function redactObject(value: unknown): unknown {
  if (typeof value === 'string') return redactProhibited(value).text
  if (Array.isArray(value)) return value.map(redactObject)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, redactObject(item)]))
  }
  return value
}
