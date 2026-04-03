/**
 * Shared carousel slide rendering — used by CarouselBuilder (creation) and
 * SocialDraftDetail (regeneration after edits).
 */

import { createClient } from '@/lib/supabase/client'

const GOLD = 'var(--primary)'
export const SLIDE_SIZE = 1080

export type Slide = { text: string }

/** Word-wrap text for Canvas rendering */
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }
    const words = paragraph.split(' ')
    let current = ''
    for (const word of words) {
      const test = current ? current + ' ' + word : word
      if (ctx.measureText(test).width > maxWidth) {
        if (current) lines.push(current)
        current = word
      } else {
        current = test
      }
    }
    if (current) lines.push(current)
  }
  return lines
}

/** Render a single carousel slide to a canvas context */
export function renderSlideToCtx(
  ctx: CanvasRenderingContext2D,
  size: number,
  slide: Slide,
  index: number,
  total: number,
  bgImage: HTMLImageElement | null,
) {
  // Background
  if (bgImage) {
    const imgRatio = bgImage.width / bgImage.height
    let sx = 0, sy = 0, sw = bgImage.width, sh = bgImage.height
    if (imgRatio > 1) {
      sw = bgImage.height
      sx = (bgImage.width - sw) / 2
    } else {
      sh = bgImage.width
      sy = (bgImage.height - sh) / 2
    }
    ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, size, size)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fillRect(0, 0, size, size)
  } else {
    ctx.fillStyle = 'var(--bg)'
    ctx.fillRect(0, 0, size, size)
  }

  const scale = size / SLIDE_SIZE
  const pad = 60 * scale
  const isFirst = index === 0
  const isLast = index === total - 1

  // Slide counter — top left
  ctx.fillStyle = '#52525b'
  ctx.font = `${Math.round(22 * scale)}px system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(`${index + 1} / ${total}`, pad, pad * 0.7)

  // Main text — centered
  const fontSize = Math.round((isFirst ? 62 : 50) * scale)
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillStyle = isFirst || isLast ? GOLD : '#e4e4e7'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxWidth = size - pad * 2
  const lines = wrapText(ctx, slide.text, maxWidth)
  const lineHeight = fontSize * 1.35
  const totalTextHeight = lines.length * lineHeight
  const startY = (size - totalTextHeight) / 2 + lineHeight / 2

  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '') continue
    ctx.fillText(lines[i], size / 2, startY + i * lineHeight, maxWidth)
  }

  // Branding bar — bottom
  const barY = size - pad * 1.4
  ctx.strokeStyle = 'var(--card)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(pad, barY)
  ctx.lineTo(size - pad, barY)
  ctx.stroke()

  const brandSize = Math.round(17 * scale)
  ctx.font = `${brandSize}px system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif`
  ctx.fillStyle = '#52525b'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('Adam Styer | Mortgage Solutions LP', pad, barY + 12 * scale)

  if (isLast) {
    ctx.fillStyle = GOLD
    ctx.textAlign = 'right'
    ctx.font = `bold ${brandSize}px system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif`
    ctx.fillText('NMLS# 513013', size - pad, barY + 12 * scale)
  }
}

/** Parse draft content back into caption + slides */
export function parseContentToSlides(content: string): { caption: string; slides: Slide[] } {
  // Extract caption from ## Caption section
  let caption = ''
  const captionMatch = content.match(/##\s*Caption\s*\n([\s\S]*?)(?=\n---|\n##\s|$)/i)
  if (captionMatch) {
    caption = captionMatch[1].trim()
  }

  // Extract slides
  const slides: Slide[] = []
  const slideRegex = /SLIDE\s+\d+\s*[—–:-]\s*(?:HOOK|CTA|POINT\s+\d+)\s*\n([\s\S]*?)(?=SLIDE\s+\d+\s*[—–:-]|$)/gi
  let match: RegExpExecArray | null
  while ((match = slideRegex.exec(content)) !== null) {
    const text = match[1].trim()
    if (text) slides.push({ text })
  }

  return { caption, slides }
}

/** Render slides to PNG blobs, upload to Supabase, return new storage paths */
export async function regenerateCarouselImages(
  slides: Slide[],
): Promise<string[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const canvas = document.createElement('canvas')
  canvas.width = SLIDE_SIZE
  canvas.height = SLIDE_SIZE
  const ctx = canvas.getContext('2d')!

  const mediaPaths: string[] = []
  const total = slides.length

  for (let i = 0; i < total; i++) {
    renderSlideToCtx(ctx, SLIDE_SIZE, slides[i], i, total, null)

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), 'image/png'),
    )

    const storagePath = `${user.id}/social/carousel_${Date.now()}_slide${i + 1}.png`
    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, blob, { contentType: 'image/png' })

    if (uploadErr) {
      throw new Error(`Upload failed for slide ${i + 1}: ${uploadErr.message}`)
    }

    mediaPaths.push(storagePath)
  }

  return mediaPaths
}
