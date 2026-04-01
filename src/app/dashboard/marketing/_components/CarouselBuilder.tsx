'use client'

import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SocialDraft } from './SocialDraftList'

const GOLD = '#C9A84C'
const SLIDE_SIZE = 1080
const PREVIEW_SIZE = 340

type Slide = { text: string }
type BgMode = 'black' | 'image'

type Props = {
  onDraftCreated: (draft: SocialDraft) => void
  onClose: () => void
}

/** Word-wrap text for Canvas rendering */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = []
  // Split on explicit newlines first
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
function renderSlideToCtx(
  ctx: CanvasRenderingContext2D,
  size: number,
  slide: Slide,
  index: number,
  total: number,
  bgImage: HTMLImageElement | null,
) {
  // Background
  if (bgImage) {
    // Cover-fit the image
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
    // Dark overlay for text readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)'
    ctx.fillRect(0, 0, size, size)
  } else {
    ctx.fillStyle = '#0a0a0a'
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
  ctx.strokeStyle = '#1a1a1a'
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

/** CSS-based slide preview (matches Canvas output visually) */
function SlidePreview({
  slide,
  index,
  total,
  bgDataUrl,
  bgMode,
  size,
}: {
  slide: Slide
  index: number
  total: number
  bgDataUrl: string | null
  bgMode: BgMode
  size: number
}) {
  const isFirst = index === 0
  const isLast = index === total - 1
  const scale = size / SLIDE_SIZE

  return (
    <div
      className="relative overflow-hidden flex flex-col justify-between"
      style={{
        width: size,
        height: size,
        background: bgMode === 'image' && bgDataUrl ? `url(${bgDataUrl}) center/cover` : '#0a0a0a',
        fontFamily: "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
        padding: 60 * scale,
        borderRadius: 8 * scale,
      }}
    >
      {/* Dark overlay for image backgrounds */}
      {bgMode === 'image' && bgDataUrl && (
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(0, 0, 0, 0.55)' }}
        />
      )}

      {/* Content (above overlay) */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Slide counter */}
        <div style={{ color: '#52525b', fontSize: 22 * scale, fontWeight: 400 }}>
          {index + 1} / {total}
        </div>

        {/* Main text */}
        <div
          className="flex-1 flex items-center justify-center text-center"
          style={{
            color: isFirst || isLast ? GOLD : '#e4e4e7',
            fontSize: (isFirst ? 62 : 50) * scale,
            fontWeight: 700,
            lineHeight: 1.35,
            wordBreak: 'break-word',
          }}
        >
          <div>{slide.text || '(empty slide)'}</div>
        </div>

        {/* Branding bar */}
        <div
          className="flex items-center justify-between"
          style={{
            borderTop: '1px solid #1a1a1a',
            paddingTop: 12 * scale,
          }}
        >
          <span style={{ color: '#52525b', fontSize: 17 * scale }}>
            Adam Styer | Mortgage Solutions LP
          </span>
          {isLast && (
            <span style={{ color: GOLD, fontSize: 17 * scale, fontWeight: 700 }}>
              NMLS# 513013
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CarouselBuilder({ onDraftCreated, onClose }: Props) {
  const [slides, setSlides] = useState<Slide[]>([
    { text: '' },
    { text: '' },
    { text: '' },
  ])
  const [bgMode, setBgMode] = useState<BgMode>('black')
  const [bgDataUrl, setBgDataUrl] = useState<string | null>(null)
  const [bgFileName, setBgFileName] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [selectedSlide, setSelectedSlide] = useState(0)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bgInputRef = useRef<HTMLInputElement>(null)
  // Keep the raw file for potential future use
  const bgFileRef = useRef<File | null>(null)

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiSlideCount, setAiSlideCount] = useState(5)
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)

  /** AI-generate slide content from a prompt */
  const handleAiGenerate = useCallback(async () => {
    if (!aiPrompt.trim()) return
    setAiGenerating(true)
    setAiError(null)

    try {
      const res = await fetch('/api/chat/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Create a ${aiSlideCount}-slide Instagram carousel about: ${aiPrompt}

Return ONLY a JSON array of objects, each with a "text" field for the slide content. The first slide should be a strong hook, middle slides should be valuable points, and the last slide should be a call to action.

Example format:
[
  {"text": "Hook text here"},
  {"text": "Point 1"},
  {"text": "Point 2"},
  {"text": "Call to action"}
]

Rules:
- Keep each slide to 1-3 short sentences max
- Write in Adam's voice — punchy, direct, conversational
- First slide = attention-grabbing hook (question or bold statement)
- Last slide = clear CTA
- No hashtags in slide text
- Return ONLY the JSON array, nothing else`,
            },
          ],
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Generation failed' }))
        setAiError(errData.error || `Failed (${res.status})`)
        return
      }

      const data = await res.json()
      const text = data.message?.content || ''

      // Parse JSON array from Claude's response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        setAiError('AI response was not in expected format. Try again.')
        return
      }

      const parsed = JSON.parse(jsonMatch[0]) as Array<{ text: string }>
      if (!Array.isArray(parsed) || parsed.length < 2) {
        setAiError('Need at least 2 slides. Try again.')
        return
      }

      // Populate slides
      setSlides(parsed.map((s) => ({ text: s.text || '' })))
      setSelectedSlide(0)
      setGenerated(true)
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setAiGenerating(false)
    }
  }, [aiPrompt, aiSlideCount])

  const updateSlide = useCallback((index: number, text: string) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? { text } : s)))
  }, [])

  const addSlide = useCallback(() => {
    setSlides((prev) => [...prev, { text: '' }])
  }, [])

  const removeSlide = useCallback((index: number) => {
    setSlides((prev) => {
      if (prev.length <= 2) return prev // Minimum 2 slides
      const next = prev.filter((_, i) => i !== index)
      return next
    })
    setSelectedSlide((prev) => Math.min(prev, slides.length - 2))
  }, [slides.length])

  const moveSlide = useCallback((from: number, to: number) => {
    setSlides((prev) => {
      if (to < 0 || to >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
    setSelectedSlide(to)
  }, [])

  const handleBgUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    bgFileRef.current = file
    setBgFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => setBgDataUrl(reader.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }, [])

  /** Load background image as HTMLImageElement for Canvas rendering */
  function loadBgImage(): Promise<HTMLImageElement | null> {
    if (bgMode !== 'image' || !bgDataUrl) return Promise.resolve(null)
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = bgDataUrl
    })
  }

  /** Render all slides to images and create a draft */
  async function handleCreate() {
    // Validate
    const nonEmpty = slides.filter((s) => s.text.trim())
    if (nonEmpty.length < 2) {
      setError('Need at least 2 slides with text')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Not authenticated')
        setCreating(false)
        return
      }

      // Load background image if needed
      const bgImage = await loadBgImage()

      // Render each slide to a PNG blob
      const canvas = document.createElement('canvas')
      canvas.width = SLIDE_SIZE
      canvas.height = SLIDE_SIZE
      const ctx = canvas.getContext('2d')!

      const mediaPaths: string[] = []
      const total = slides.length

      for (let i = 0; i < total; i++) {
        renderSlideToCtx(ctx, SLIDE_SIZE, slides[i], i, total, bgImage)

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png'),
        )

        // Upload to Supabase storage
        const storagePath = `${user.id}/social/carousel_${Date.now()}_slide${i + 1}.png`
        const { error: uploadErr } = await supabase.storage
          .from('documents')
          .upload(storagePath, blob, { contentType: 'image/png' })

        if (uploadErr) {
          setError(`Upload failed for slide ${i + 1}: ${uploadErr.message}`)
          setCreating(false)
          return
        }

        mediaPaths.push(storagePath)
      }

      // Build the structured content text (so it also works with the existing slide preview)
      const contentLines: string[] = []
      if (caption.trim()) {
        contentLines.push(caption.trim())
        contentLines.push('')
      }
      slides.forEach((s, i) => {
        const label = i === 0 ? 'HOOK' : i === slides.length - 1 ? 'CTA' : `POINT ${i}`
        contentLines.push(`SLIDE ${i + 1} — ${label}`)
        contentLines.push(s.text)
        contentLines.push('')
      })

      // Create the draft via API
      const res = await fetch('/api/social/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: slides[0].text.slice(0, 60) || 'Carousel Post',
          content: contentLines.join('\n').trim(),
          platform: 'all',
          format: 'carousel',
          hashtags: null,
          media_urls: mediaPaths,
          status: 'draft',
          agent_notes: `Carousel built manually — ${slides.length} slides, bg: ${bgMode}`,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setError(data.error || `Failed to create draft (${res.status})`)
        setCreating(false)
        return
      }

      const data = await res.json()
      const draft: SocialDraft = data.draft ?? {
        id: data.id || crypto.randomUUID(),
        platform: 'all',
        format: 'carousel',
        pillar: null,
        title: slides[0].text.slice(0, 60) || 'Carousel Post',
        content: contentLines.join('\n').trim(),
        hashtags: null,
        media_urls: mediaPaths,
        status: 'draft' as const,
        scheduled_for: null,
        agent_notes: `Carousel built manually — ${slides.length} slides, bg: ${bgMode}`,
        publer_post_id: null,
        created_by: 'human',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      onDraftCreated(draft)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create carousel')
    } finally {
      setCreating(false)
    }
  }

  const safeIndex = Math.min(selectedSlide, slides.length - 1)

  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div
          className="font-bold"
          style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
        >
          CAROUSEL BUILDER
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 text-xs font-bold tracking-wider hover:text-zinc-300 transition-colors"
          style={{ fontFamily: 'inherit' }}
        >
          X CLOSE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex h-full">
          {/* Left column: slide editor */}
          <div className="w-80 border-r border-zinc-800 p-4 space-y-4 overflow-y-auto">
            {/* AI Generation */}
            {!generated && (
              <div className="rounded-md border border-zinc-700 p-3 space-y-2" style={{ background: '#0d0d18' }}>
                <label
                  className="block font-bold"
                  style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
                >
                  ✨ GENERATE WITH AI
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={3}
                  placeholder="e.g. 5 things first-time buyers don't know about closing costs..."
                  className="w-full rounded-md border border-zinc-800 text-zinc-100 text-xs px-3 py-2 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 resize-none"
                  style={{ background: '#111118', fontFamily: 'inherit', lineHeight: 1.5 }}
                />
                <div className="flex items-center gap-2">
                  <label className="text-zinc-500" style={{ fontSize: 10 }}>SLIDES:</label>
                  <div className="flex gap-1">
                    {[3, 4, 5, 6, 7, 8].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAiSlideCount(n)}
                        className="w-6 h-6 rounded text-xs font-bold transition-colors"
                        style={{
                          background: aiSlideCount === n ? GOLD : 'transparent',
                          color: aiSlideCount === n ? '#09090b' : '#71717a',
                          border: aiSlideCount === n ? `1px solid ${GOLD}` : '1px solid #3f3f46',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                {aiError && (
                  <p className="text-red-400" style={{ fontSize: 10 }}>{aiError}</p>
                )}
                <button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="w-full py-2 rounded-sm text-xs font-bold tracking-widest transition-opacity hover:opacity-80 disabled:opacity-40"
                  style={{ background: GOLD, color: '#09090b', fontFamily: 'inherit' }}
                >
                  {aiGenerating ? 'GENERATING...' : 'GENERATE SLIDES'}
                </button>
                <div className="text-center" style={{ color: '#52525b', fontSize: 9 }}>
                  Or skip and build manually below
                </div>
              </div>
            )}

            {/* Regenerate option after AI generation */}
            {generated && (
              <button
                onClick={() => { setGenerated(false); setAiError(null) }}
                className="w-full py-1.5 rounded-sm text-xs font-bold tracking-wider transition-opacity hover:opacity-80"
                style={{
                  background: 'transparent',
                  color: GOLD,
                  border: `1px dashed ${GOLD}`,
                  fontFamily: 'inherit',
                }}
              >
                ↻ REGENERATE WITH AI
              </button>
            )}

            {/* Caption */}
            <div>
              <label
                className="block font-bold mb-1.5"
                style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
              >
                CAPTION (OPTIONAL)
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={2}
                placeholder="Caption for the post..."
                className="w-full rounded-md border border-zinc-800 text-zinc-100 text-xs px-3 py-2 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 resize-none"
                style={{ background: '#111118', fontFamily: 'inherit', lineHeight: 1.5 }}
              />
            </div>

            {/* Background picker */}
            <div>
              <label
                className="block font-bold mb-1.5"
                style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
              >
                BACKGROUND
              </label>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setBgMode('black')}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-colors"
                  style={{
                    background: bgMode === 'black' ? GOLD : 'transparent',
                    color: bgMode === 'black' ? '#09090b' : '#71717a',
                    border: bgMode === 'black' ? `1px solid ${GOLD}` : '1px solid #3f3f46',
                    fontFamily: 'inherit',
                  }}
                >
                  SOLID BLACK
                </button>
                <button
                  onClick={() => {
                    setBgMode('image')
                    if (!bgDataUrl) bgInputRef.current?.click()
                  }}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-colors"
                  style={{
                    background: bgMode === 'image' ? GOLD : 'transparent',
                    color: bgMode === 'image' ? '#09090b' : '#71717a',
                    border: bgMode === 'image' ? `1px solid ${GOLD}` : '1px solid #3f3f46',
                    fontFamily: 'inherit',
                  }}
                >
                  UPLOAD IMAGE
                </button>
                <input
                  ref={bgInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBgUpload}
                />
              </div>
              {bgMode === 'image' && bgFileName && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-zinc-500 truncate" style={{ fontSize: 10 }}>
                    {bgFileName}
                  </span>
                  <button
                    onClick={() => bgInputRef.current?.click()}
                    className="text-xs font-bold transition-opacity hover:opacity-80"
                    style={{ color: GOLD, fontFamily: 'inherit' }}
                  >
                    CHANGE
                  </button>
                </div>
              )}
            </div>

            {/* Slides */}
            <div>
              <label
                className="block font-bold mb-1.5"
                style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
              >
                SLIDES ({slides.length})
              </label>
              <div className="space-y-2">
                {slides.map((slide, i) => {
                  const isFirst = i === 0
                  const isLastSlide = i === slides.length - 1
                  const label = isFirst ? 'HOOK' : isLastSlide ? 'CTA' : `SLIDE ${i + 1}`
                  return (
                    <div
                      key={i}
                      className="rounded-md border p-2"
                      style={{
                        borderColor: i === safeIndex ? GOLD : '#27272a',
                        background: i === safeIndex ? `${GOLD}08` : '#111118',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedSlide(i)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="font-bold"
                          style={{
                            fontSize: 9,
                            color: isFirst || isLastSlide ? GOLD : '#71717a',
                            letterSpacing: '0.1em',
                          }}
                        >
                          {label}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveSlide(i, i - 1) }}
                            disabled={i === 0}
                            className="w-5 h-5 flex items-center justify-center rounded text-xs disabled:opacity-20 hover:opacity-80"
                            style={{ color: '#71717a' }}
                          >
                            ▲
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveSlide(i, i + 1) }}
                            disabled={isLastSlide}
                            className="w-5 h-5 flex items-center justify-center rounded text-xs disabled:opacity-20 hover:opacity-80"
                            style={{ color: '#71717a' }}
                          >
                            ▼
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); removeSlide(i) }}
                            disabled={slides.length <= 2}
                            className="w-5 h-5 flex items-center justify-center rounded text-xs disabled:opacity-20 hover:opacity-80"
                            style={{ color: '#E05252' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={slide.text}
                        onChange={(e) => updateSlide(i, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        rows={2}
                        placeholder={
                          isFirst
                            ? 'Hook — grab attention...'
                            : isLastSlide
                            ? 'Call to action...'
                            : 'Slide content...'
                        }
                        className="w-full rounded border border-zinc-800 text-zinc-100 text-xs px-2 py-1.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 resize-none"
                        style={{
                          background: 'transparent',
                          fontFamily: 'inherit',
                          lineHeight: 1.5,
                        }}
                      />
                    </div>
                  )
                })}
              </div>

              {/* Add slide button */}
              {slides.length < 10 && (
                <button
                  onClick={addSlide}
                  className="w-full mt-2 py-1.5 rounded-sm text-xs font-bold tracking-wider transition-opacity hover:opacity-80"
                  style={{
                    background: 'transparent',
                    color: '#71717a',
                    border: '1px dashed #3f3f46',
                    fontFamily: 'inherit',
                  }}
                >
                  + ADD SLIDE
                </button>
              )}
            </div>
          </div>

          {/* Right column: preview */}
          <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-y-auto">
            {/* Main preview */}
            <SlidePreview
              slide={slides[safeIndex]}
              index={safeIndex}
              total={slides.length}
              bgDataUrl={bgDataUrl}
              bgMode={bgMode}
              size={PREVIEW_SIZE}
            />

            {/* Navigation */}
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setSelectedSlide(Math.max(0, safeIndex - 1))}
                disabled={safeIndex === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold disabled:opacity-20 transition-opacity hover:opacity-80"
                style={{ background: '#18181b', color: '#fff', border: '1px solid #3f3f46' }}
              >
                ←
              </button>
              <div className="flex gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSlide(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === safeIndex ? 16 : 6,
                      height: 6,
                      background: i === safeIndex ? GOLD : '#3f3f46',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => setSelectedSlide(Math.min(slides.length - 1, safeIndex + 1))}
                disabled={safeIndex === slides.length - 1}
                className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold disabled:opacity-20 transition-opacity hover:opacity-80"
                style={{ background: '#18181b', color: '#fff', border: '1px solid #3f3f46' }}
              >
                →
              </button>
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {slides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSlide(i)}
                  className="flex-shrink-0 rounded overflow-hidden transition-all"
                  style={{
                    border: i === safeIndex ? `2px solid ${GOLD}` : '2px solid #27272a',
                    opacity: i === safeIndex ? 1 : 0.6,
                  }}
                >
                  <SlidePreview
                    slide={slide}
                    index={i}
                    total={slides.length}
                    bgDataUrl={bgDataUrl}
                    bgMode={bgMode}
                    size={80}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-zinc-800 p-4 space-y-2">
        {error && (
          <div
            className="rounded-sm px-3 py-2 text-xs font-bold"
            style={{ background: '#1a0505', color: '#E05252', border: '1px solid #E05252' }}
          >
            {error}
          </div>
        )}
        <button
          onClick={handleCreate}
          disabled={creating || slides.filter((s) => s.text.trim()).length < 2}
          className="w-full py-2.5 rounded-sm text-xs font-bold tracking-widest transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: GOLD, color: '#09090b', fontFamily: 'inherit' }}
        >
          {creating ? 'GENERATING SLIDES...' : 'CREATE CAROUSEL DRAFT'}
        </button>
      </div>
    </div>
  )
}
