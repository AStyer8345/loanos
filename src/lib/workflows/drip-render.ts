// src/lib/workflows/drip-render.ts
//
// Render plain-text nurture email bodies into safe HTML.
// Bodies are authored in plain text with {{var}} merge tags so they stay
// editable in-file; the Workflow DevKit step converts to HTML at send time.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function linkify(s: string): string {
  // Wrap bare http(s) URLs in <a> tags after escaping.
  return s.replace(
    /(https?:\/\/[^\s<]+)/g,
    (url) => `<a href="${url}">${url}</a>`
  )
}

/**
 * Merge {{first_name}}-style variables into a plain-text body, then convert
 * to HTML: blank-line-separated paragraphs, single newlines become <br>,
 * bare URLs become links.
 */
export function renderDripHtml(
  plain: string,
  vars: Record<string, string>
): string {
  const merged = plain.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '')
  return merged
    .split(/\n\s*\n/)
    .map((para) => {
      const escaped = escapeHtml(para.trim()).replace(/\n/g, '<br>')
      return `<p>${linkify(escaped)}</p>`
    })
    .join('\n')
}
