'use client'

import { GOLD, MUTED, CARD_BG, BORDER } from './constants'

interface ShareVideoEmbedProps {
  videoUrl: string
}

/**
 * Converts Loom / YouTube share URLs to embed URLs.
 * Returns the original URL unchanged for anything else (already an embed, Vimeo, etc.).
 */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url)
    // Loom: https://www.loom.com/share/abc123 → https://www.loom.com/embed/abc123
    if (u.hostname.includes('loom.com')) {
      return `https://www.loom.com${u.pathname.replace('/share/', '/embed/')}${u.search}`
    }
    // YouTube watch: https://www.youtube.com/watch?v=abc
    if (u.hostname.includes('youtube.com')) {
      const vid = u.searchParams.get('v')
      return vid ? `https://www.youtube.com/embed/${vid}` : url
    }
    // YouTube short: https://youtu.be/abc
    if (u.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed${u.pathname}`
    }
    return url
  } catch {
    return null
  }
}

export default function ShareVideoEmbed({ videoUrl }: ShareVideoEmbedProps) {
  const embedUrl = toEmbedUrl(videoUrl)
  if (!embedUrl) return null

  return (
    <section className="print:hidden mb-8">
      {/* Section header — matches SectionIntro style in SharePageLayout */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-0.5">
          <div style={{ width: 16, height: 1, background: GOLD }} />
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.15em]"
            style={{ color: GOLD }}
          >
            Walk Me Through This
          </p>
        </div>
        <p className="text-xs ml-7" style={{ color: MUTED }}>
          Your loan officer walks you through these options.
        </p>
      </div>

      {/* Responsive 16:9 video container */}
      <div
        className="relative w-full rounded-lg overflow-hidden"
        style={{
          paddingBottom: '56.25%',
          background: CARD_BG,
          border: `1px solid ${BORDER}`,
        }}
      >
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Loan officer video walkthrough"
          style={{ border: 'none' }}
        />
      </div>
    </section>
  )
}
