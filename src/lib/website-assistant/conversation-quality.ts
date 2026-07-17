type QualityMessage = { role: 'visitor' | 'assistant' | 'system'; redacted_text: string }

export type ConversationQuality = { score: number; flags: string[] }

export function evaluateWebsiteConversation(messages: QualityMessage[]): ConversationQuality {
  const assistant = messages.filter((message) => message.role === 'assistant').map((message) => message.redacted_text.trim())
  const visitorCount = messages.filter((message) => message.role === 'visitor').length
  const flags: string[] = []
  if (assistant.some((text) => (text.match(/\?/g) ?? []).length > 1)) flags.push('Too many questions')
  if (new Set(assistant.map(normalize)).size < assistant.length) flags.push('Repeated answer')
  if (assistant.some((text) => /not enough approved information/i.test(text))) flags.push('Generic fallback')
  if (assistant.filter((text) => /Adam or (?:his|someone on his) team/i.test(text)).length > Math.max(1, Math.ceil(assistant.length / 2))) flags.push('Overuses handoff')
  if (assistant.some((text) => text.length > 2200)) flags.push('Answer too long')
  if (visitorCount >= 3 && assistant.length >= 3 && !assistant.some((text) => /calculator|application|contact|text Adam|review your|scenario review/i.test(text))) flags.push('No clear next step')
  return { score: Math.max(0, 100 - flags.length * 15), flags }
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}
