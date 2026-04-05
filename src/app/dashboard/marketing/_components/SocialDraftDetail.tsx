'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SocialDraft } from './SocialDraftList'
import MediaManager from './MediaManager'
import SocialPostPreview from './SocialPostPreview'
import { parseContentToSlides, regenerateCarouselImages, loadCarouselBranding } from './carouselRenderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

const BRAND_GOLD = 'var(--primary)'

/** Lightweight inline markdown → HTML for social post preview. */
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:8px 0" />')
    .replace(/^- (.+)$/gm, '<span style="display:flex;gap:6px;margin-bottom:2px"><span style="color:#C9A84C;flex-shrink:0">•</span><span>$1</span></span>')
}

/** Lines that are Canva design instructions, not displayable content */
const designInstructionPattern = /^\s*(?:\*\*)?(?:Visual|Text on image|Caption starter)(?:\*\*)?:.*$/i

/** Strip metadata, headers, contact blocks, hashtags, and image notes from draft content */
function cleanContentForDisplay(content: string): string {
  let text = content.replace(/\r\n/g, '\n')
  text = text.replace(/\n##\s*(?:Hashtags?|Notes?|Image\s+Notes?|LinkedIn\s*Version|Design\s+Brief|Canva|Agent\s+Notes?)\b[\s\S]*/i, '')
  text = text.replace(/^##\s*(?:Caption|Post)\s*\n/gim, '')
  text = text.replace(/^#\s+.*$/gm, '')
  text = text.replace(/^\*\*[A-Za-z][^*]*:\*\*.*$/gm, '')
  text = text.replace(/^\*\*NMLS#[^*]*\*\*\s*$/gm, '')
  text = text.replace(/^NMLS#?\s*\d+.*$/gm, '')
  text = text.replace(/^[📧📱🏢]\s*.*$/gm, '')
  text = text.replace(/^adam@\S+.*$/gim, '')
  text = text.replace(/^\d{3}[-.]\d{3}[-.]\d{4}\s*$/gm, '')
  text = text.replace(/^---\s*$/gm, '')
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  return text
}

function parseSlides(content: string): { intro: string; slides: { num: number; title: string; body: string }[] } {
  let cleaned = content.replace(/^(?:CLAUDE|APPLY TO POST|YOU|SEND)\s*\n/gim, '')
  const briefIdx = cleaned.search(/\n---\s*\n+\s*(?:#{1,3}\s+)?(?:CANVA|DESIGN)\s+(?:DESIGN\s+)?BRIEF/i)
  if (briefIdx > 0) cleaned = cleaned.substring(0, briefIdx)
  const hashIdx = cleaned.search(/\n---\s*\n+\s*\*\*Hashtags?\*\*\s*:/i)
  if (hashIdx > 0) cleaned = cleaned.substring(0, hashIdx)
  const captionIdx = cleaned.search(/\n\s*(?:#{1,3}\s+)?(?:\*\*)?FULL CAPTION(?:\*\*)?:?\s*\n/i)
  if (captionIdx > 0) cleaned = cleaned.substring(0, captionIdx)
  const agentIdx = cleaned.search(/\n---\s*\n+\s*(?:\*\*)?Agent\s+Notes?\s*(?:\*\*)?:?/i)
  if (agentIdx > 0) cleaned = cleaned.substring(0, agentIdx)

  cleaned = cleaned
    .replace(/^---\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n')

  const slideRegex = /(?:^|\n)\s*(?:#{1,3}\s+)?(?:\*\*|\[)?SLIDE\s+(\d+)(?:\s*[—–:\-]\s*([^\n\]*]*))?(?:\*\*|\])?\s*\n([\s\S]*?)(?=(?:\n\s*(?:#{1,3}\s+)?(?:\*\*|\[)?SLIDE\s+\d)|$)/gi
  const slides: { num: number; title: string; body: string }[] = []
  let match: RegExpExecArray | null

  while ((match = slideRegex.exec(cleaned)) !== null) {
    const num = parseInt(match[1], 10)
    const title = (match[2] || '').trim().replace(/\*\*/g, '').replace(/\]$/, '').replace(/\(.*?\)\s*$/, '').trim()
    let body = (match[3] || '').trim().replace(/^\n+|\n+$/g, '')
    body = body.replace(/\*\*([^*]+)\*\*/g, '$1')
    body = body
      .split('\n')
      .filter((l) => !designInstructionPattern.test(l))
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    if (body || title) {
      slides.push({ num, title, body })
    }
  }

  const firstSlideIdx = cleaned.search(/(?:^|\n)\s*(?:#{1,3}\s+)?(?:\*\*|\[)?SLIDE\s+1\b/i)
  const metaPattern = /^\s*(?:#{1,3}\s+)?(?:\*\*)?(?:TITLE|PLATFORM|FORMAT|PILLAR|CURRENT CONTENT|CAPTION(\s*\(.*?\))?)(?:\*\*)?\s*:?/i
  const postTitlePattern = /^\s*#{1,3}\s+Post\s+\d+\s*[—–:-].*/i
  const introRaw = firstSlideIdx > 0 ? cleaned.substring(0, firstSlideIdx) : ''
  const intro = introRaw
    .split('\n')
    .filter((l) => !metaPattern.test(l) && !postTitlePattern.test(l) && !designInstructionPattern.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { intro, slides }
}

type Props = {
  draft: SocialDraft
  onUpdate: (draft: SocialDraft) => void
  onDelete: (id: string) => void
  onOpenVoiceGuide: () => void
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Branded slide card */
function SlideCard({ slide, total }: { slide: { num: number; title: string; body: string }; total: number }) {
  const isFirst = slide.num === 1
  const isLast = slide.num === total
  const isCTA = isLast || /cta/i.test(slide.title)

  return (
    <div
      className={cn(
        'rounded-lg overflow-hidden p-4',
        isCTA ? 'border-primary/40 border bg-primary/5' : 'border border-input bg-card',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="default" className="text-[10px] px-2 py-0 h-5 font-mono">
          {slide.num} / {total}
        </Badge>
        {slide.title && (
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
            {slide.title}
          </span>
        )}
      </div>

      {isFirst ? (
        <>
          <div className="font-semibold text-primary text-[15px] leading-snug mb-1">
            {slide.body.split('\n')[0]}
          </div>
          {slide.body.split('\n').slice(1).join('\n').trim() && (
            <div className="text-foreground text-xs leading-relaxed">
              {slide.body.split('\n').slice(1).join('\n').trim()}
            </div>
          )}
        </>
      ) : (
        <div
          className={cn(
            'whitespace-pre-wrap text-xs leading-relaxed',
            isCTA ? 'text-primary font-semibold' : 'text-foreground',
          )}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(slide.body) }}
        />
      )}
    </div>
  )
}

/** Shows branded slide carousel for carousel/multi-slide posts, plain text for others */
function SlidePreviewOrText({
  draft,
  slideIndex,
  setSlideIndex,
}: {
  draft: SocialDraft
  slideIndex: number
  setSlideIndex: (i: number) => void
}) {
  const { intro, slides } = parseSlides(draft.content || '')
  const hasSlides = slides.length >= 2

  if (!hasSlides) {
    const displayText = cleanContentForDisplay(draft.content || '')
    return (
      <div
        className="rounded-lg border border-input bg-card px-4 py-3 text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed font-sans"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(displayText || '(empty)') }}
      />
    )
  }

  const safeIndex = Math.min(slideIndex, slides.length - 1)
  const currentSlide = slides[safeIndex]

  return (
    <div className="space-y-3">
      {intro && (
        <div
          className="rounded-lg border border-input bg-card px-4 py-3 text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed font-sans"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(intro) }}
        />
      )}

      <SlideCard slide={currentSlide} total={slides.length} />

      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setSlideIndex(Math.max(0, safeIndex - 1))}
          disabled={safeIndex === 0}
          className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold disabled:opacity-20 transition-opacity hover:opacity-80 border border-input bg-card"
        >
          &#8592;
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className="rounded-full transition-all"
              style={{
                width: i === safeIndex ? 16 : 6,
                height: 6,
                background: i === safeIndex ? BRAND_GOLD : 'var(--border)',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setSlideIndex(Math.min(slides.length - 1, safeIndex + 1))}
          disabled={safeIndex === slides.length - 1}
          className="w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold disabled:opacity-20 transition-opacity hover:opacity-80 border border-input bg-card"
        >
          &#8594;
        </button>
      </div>
    </div>
  )
}

const FORMAT_OPTIONS: { value: string; label: string }[] = [
  { value: 'single_image', label: 'Single Image' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'video', label: 'Video' },
  { value: 'reel_script', label: 'Reel Script' },
  { value: 'text_only', label: 'Text Only' },
]

function FormatSwitcher({ current, onChange }: { current: string | null; onChange: (fmt: string) => void }) {
  const [open, setOpen] = useState(false)
  const label = FORMAT_OPTIONS.find((f) => f.value === current)?.label || current || 'No format'

  return (
    <div className="relative inline-block">
      <Badge
        variant="outline"
        className="cursor-pointer hover:bg-accent text-[10px] tracking-wider"
        onClick={() => setOpen(!open)}
      >
        {label.toUpperCase()} ▾
      </Badge>
      {open && (
        <div className="absolute top-full left-0 mt-1 rounded-lg border border-input bg-card shadow-lg py-1 z-50 min-w-[140px]">
          {FORMAT_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => { onChange(f.value); setOpen(false) }}
              className={cn(
                'block w-full text-left px-3 py-1.5 text-[10px] font-semibold tracking-wider transition-colors hover:bg-accent',
                f.value === current ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {f.label.toUpperCase()}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SocialDraftDetail({ draft, onUpdate, onDelete, onOpenVoiceGuide }: Props) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(draft.content || '')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [slideIndex, setSlideIndex] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

  // Carousel edit state
  const [editCaption, setEditCaption] = useState('')
  const [editSlides, setEditSlides] = useState<{ text: string }[]>([])
  const [regenerating, setRegenerating] = useState(false)
  const [regenError, setRegenError] = useState<string | null>(null)

  const [signedMediaUrls, setSignedMediaUrls] = useState<string[]>([])

  useEffect(() => {
    const urls = draft.media_urls
    if (!urls || urls.length === 0) {
      setSignedMediaUrls([])
      return
    }

    let cancelled = false
    async function resolveUrls() {
      const supabase = createClient()
      const resolved: string[] = []
      for (const urlOrPath of urls!) {
        if (urlOrPath.includes('token=') || !urlOrPath.includes('supabase') && urlOrPath.startsWith('http') && !urlOrPath.includes('/storage/v1/')) {
          resolved.push(urlOrPath)
          continue
        }
        let storagePath = urlOrPath
        const storageIdx = urlOrPath.indexOf('/storage/v1/object/')
        if (storageIdx !== -1) {
          const afterStorage = urlOrPath.substring(storageIdx + '/storage/v1/object/'.length)
          storagePath = afterStorage.replace(/^(public|authenticated)\/documents\//, '')
        }
        const { data, error } = await supabase.storage
          .from('documents')
          .createSignedUrl(storagePath, 3600)
        if (!error && data?.signedUrl) {
          resolved.push(data.signedUrl)
        } else {
          resolved.push(urlOrPath)
        }
      }
      if (!cancelled) setSignedMediaUrls(resolved)
    }
    resolveUrls()
    return () => { cancelled = true }
  }, [draft.media_urls])

  const handleMediaChange = useCallback((newPaths: string[]) => {
    onUpdate({ ...draft, media_urls: newPaths.length > 0 ? newPaths : null })
  }, [draft, onUpdate])

  const handleFormatChange = useCallback((fmt: string) => {
    onUpdate({ ...draft, format: fmt })
  }, [draft, onUpdate])

  // Reset edit state when draft changes
  const [prevId, setPrevId] = useState(draft.id)
  const [prevContent, setPrevContent] = useState(draft.content || '')
  if (draft.id !== prevId) {
    setPrevId(draft.id)
    setPrevContent(draft.content || '')
    setEditing(false)
    setEditContent(draft.content || '')
    setMessages([])
    setChatInput('')
    setSlideIndex(0)
    setPublishError(null)
  } else if (draft.content !== prevContent && !editing) {
    setPrevContent(draft.content || '')
    setEditContent(draft.content || '')
  }

  const isCarousel = draft.format === 'carousel'

  function handleEdit() {
    setEditing(true)
    setEditContent(draft.content || '')
    setRegenError(null)
    if (isCarousel) {
      const parsed = parseContentToSlides(draft.content || '')
      setEditCaption(parsed.caption)
      setEditSlides(parsed.slides.length >= 2 ? parsed.slides : [{ text: '' }, { text: '' }])
    }
  }

  function handleSaveText() {
    setEditing(false)
    const oldContent = draft.content || ''
    const newContent = editContent
    onUpdate({ ...draft, content: editContent })
    if (oldContent !== newContent) {
      const summary = `[${new Date().toISOString().slice(0, 10)}] EDITED "${draft.title}": Adam manually edited this post. Original started with: "${oldContent.slice(0, 80)}..." — Changed to start with: "${newContent.slice(0, 80)}..."`
      fetch('/api/social/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'voice_feedback', appendEntry: summary }),
      }).catch(() => { /* non-blocking */ })
    }
  }

  async function handleSaveCarousel() {
    const nonEmpty = editSlides.filter((s) => s.text.trim())
    if (nonEmpty.length < 2) {
      setRegenError('Need at least 2 slides with text')
      return
    }

    setRegenerating(true)
    setRegenError(null)

    try {
      // Regenerate slide images — load per-org branding fresh each time so
      // the slide footer reflects the current tenant, not a hardcoded default.
      const branding = await loadCarouselBranding()
      const newMediaPaths = await regenerateCarouselImages(nonEmpty, branding)

      // Rebuild structured content
      const contentLines: string[] = []
      if (editCaption.trim()) {
        contentLines.push('## Caption')
        contentLines.push(editCaption.trim())
        contentLines.push('')
        contentLines.push('---')
        contentLines.push('')
      }
      nonEmpty.forEach((s, i) => {
        const label = i === 0 ? 'HOOK' : i === nonEmpty.length - 1 ? 'CTA' : `POINT ${i}`
        contentLines.push(`SLIDE ${i + 1} — ${label}`)
        contentLines.push(s.text)
        contentLines.push('')
      })

      const newContent = contentLines.join('\n').trim()

      setEditing(false)
      onUpdate({
        ...draft,
        content: newContent,
        media_urls: newMediaPaths,
        title: nonEmpty[0].text.slice(0, 60) || draft.title,
      })

      // Log the edit for voice learning
      const summary = `[${new Date().toISOString().slice(0, 10)}] EDITED CAROUSEL "${draft.title}": Adam edited slides and regenerated images.`
      fetch('/api/social/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'voice_feedback', appendEntry: summary }),
      }).catch(() => { /* non-blocking */ })
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : 'Failed to regenerate slides')
    } finally {
      setRegenerating(false)
    }
  }

  function handleSave() {
    if (isCarousel) {
      handleSaveCarousel()
    } else {
      handleSaveText()
    }
  }

  function handleApprove() {
    setPublishError(null)
    onUpdate({ ...draft, status: 'approved' })
  }

  function handleReject() {
    setShowRejectModal(true)
    setRejectReason('')
  }

  async function handleRejectSubmit() {
    if (!rejectReason.trim()) return
    setShowRejectModal(false)
    onUpdate({ ...draft, status: 'rejected', rejection_reason: rejectReason.trim() } as SocialDraft)
    try {
      const res = await fetch('/api/social/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'voice_feedback', appendEntry: `[${new Date().toISOString().slice(0, 10)}] REJECTED "${draft.title}": ${rejectReason.trim()}` }),
      })
      if (!res.ok) console.error('Failed to save voice feedback')
    } catch { /* non-blocking */ }
  }

  async function handlePublish() {
    setPublishing(true)
    setPublishError(null)
    try {
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setPublishError(data.error || `Publish failed (${res.status})`)
        return
      }
      onUpdate({ ...draft, status: 'posted' })
    } catch {
      setPublishError('Network error — could not reach publish API')
    } finally {
      setPublishing(false)
    }
  }

  async function handleApproveAndPublish() {
    setPublishing(true)
    setPublishError(null)
    try {
      onUpdate({ ...draft, status: 'approved' })
      await new Promise((resolve) => setTimeout(resolve, 500))
      const res = await fetch('/api/social/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId: draft.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Unknown error' }))
        setPublishError(data.error || `Publish failed (${res.status})`)
        return
      }
      onUpdate({ ...draft, status: 'posted' })
    } catch {
      setPublishError('Network error — could not reach publish API')
    } finally {
      setPublishing(false)
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Delete this draft?')
    if (!confirmed) return
    setPublishError(null)
    try {
      const res = await fetch('/api/social/drafts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: draft.id }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Delete failed' }))
        setPublishError(data.error || `Delete failed (${res.status})`)
        return
      }
      onDelete(draft.id)
    } catch {
      setPublishError('Network error — could not delete draft')
    }
  }

  async function handleChatSend() {
    const text = chatInput.trim()
    if (!text) return
    setChatInput('')
    const userMsg: ChatMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setChatLoading(true)
    try {
      const res = await fetch('/api/chat/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, draftId: draft.id }),
      })
      if (!res.ok) throw new Error('Chat request failed')
      const data = await res.json()
      if (data.message) {
        const assistantMsg: ChatMessage = { role: 'assistant', content: data.message.content }
        setMessages([...nextMessages, assistantMsg])
      }
    } catch {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: 'Error: could not reach the chat API.' },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const subtitle = [draft.platform, draft.pillar, formatDate(draft.scheduled_for)]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-input bg-card/50">
        <div className="min-w-0 flex-1">
          <h2 className="text-foreground font-semibold text-[15px] truncate">
            {draft.title || 'Untitled'}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-muted-foreground text-[11px]">{subtitle}</span>
            <FormatSwitcher current={draft.format} onChange={handleFormatChange} />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onOpenVoiceGuide} className="text-xs tracking-wider shrink-0">
          Voice Guide
        </Button>
      </div>

      {/* ── Scrollable content area ── */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">

          {/* Post Content Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-[11px] font-semibold tracking-widest text-primary uppercase">
                Post Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <div className="space-y-3">
                  {isCarousel ? (
                    /* ── Carousel editor: caption + individual slides ── */
                    <>
                      <div>
                        <label className="block text-[10px] font-semibold tracking-widest text-primary uppercase mb-1">
                          Caption
                        </label>
                        <textarea
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          rows={3}
                          placeholder="Caption for the post (shows on Instagram, Facebook, etc.)..."
                          className="w-full rounded-lg border border-input bg-background text-foreground text-sm px-4 py-3 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed font-sans"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold tracking-widest text-primary uppercase mb-1">
                          Slides ({editSlides.length})
                        </label>
                        <div className="space-y-2">
                          {editSlides.map((slide, i) => {
                            const label = i === 0 ? 'HOOK' : i === editSlides.length - 1 ? 'CTA' : `SLIDE ${i + 1}`
                            return (
                              <div key={i} className="flex gap-2 items-start">
                                <span className="text-[9px] font-bold tracking-wider text-muted-foreground pt-3 w-12 shrink-0">
                                  {label}
                                </span>
                                <textarea
                                  value={slide.text}
                                  onChange={(e) => {
                                    const next = [...editSlides]
                                    next[i] = { text: e.target.value }
                                    setEditSlides(next)
                                  }}
                                  rows={2}
                                  className="flex-1 rounded-lg border border-input bg-background text-foreground text-sm px-3 py-2 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed font-sans"
                                />
                                {editSlides.length > 2 && (
                                  <button
                                    onClick={() => setEditSlides(editSlides.filter((_, j) => j !== i))}
                                    className="text-xs text-red-400 hover:text-red-300 pt-2.5 shrink-0"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                        {editSlides.length < 10 && (
                          <button
                            onClick={() => setEditSlides([...editSlides, { text: '' }])}
                            className="mt-2 text-[10px] font-bold tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                          >
                            + ADD SLIDE
                          </button>
                        )}
                      </div>
                      {regenError && (
                        <div className="rounded-lg px-3 py-2 text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/25">
                          {regenError}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSave} disabled={regenerating}>
                          {regenerating ? 'Regenerating...' : 'Save & Regenerate'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={regenerating}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    /* ── Standard text editor ── */
                    <>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={8}
                        className="w-full rounded-lg border border-input bg-background text-foreground text-sm px-4 py-3 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed font-sans"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSave}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <SlidePreviewOrText draft={draft} slideIndex={slideIndex} setSlideIndex={setSlideIndex} />
              )}
            </CardContent>
          </Card>

          {/* Media Card */}
          <Card>
            <CardContent className="pt-4">
              <MediaManager
                mediaPaths={draft.media_urls || []}
                signedUrls={signedMediaUrls}
                onChange={handleMediaChange}
              />
            </CardContent>
          </Card>

          {/* Action Bar */}
          {!editing && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Primary actions — left */}
                  <Button size="sm" variant="outline" onClick={() => setShowPreview(true)} className="text-violet-400 border-violet-400/40 hover:bg-violet-400/10">
                    Preview
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleApprove} className="text-emerald-400 border-emerald-400/40 hover:bg-emerald-400/10">
                    Approve
                  </Button>
                  {draft.status === 'draft' && (
                    <Button size="sm" onClick={handleApproveAndPublish} disabled={publishing}>
                      {publishing ? 'Publishing...' : 'Approve & Publish'}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={handleEdit} className="text-blue-400 border-blue-400/40 hover:bg-blue-400/10">
                    Edit
                  </Button>

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Destructive actions — right */}
                  <Button size="sm" variant="outline" onClick={handleReject} className="text-red-400 border-red-400/40 hover:bg-red-400/10">
                    Reject
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleDelete} className="text-muted-foreground hover:text-red-400">
                    Delete
                  </Button>

                  {draft.status === 'approved' && (
                    <Button size="sm" onClick={handlePublish} disabled={publishing}>
                      {publishing ? 'Publishing...' : 'Publish to Publer'}
                    </Button>
                  )}
                </div>

                {publishError && (
                  <div className="mt-3 rounded-lg px-3 py-2 text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/25">
                    {publishError}
                  </div>
                )}

                {showRejectModal && (
                  <div className="mt-3 rounded-lg p-4 space-y-3 bg-destructive/5 border border-destructive/25">
                    <div className="text-xs font-semibold text-destructive tracking-wider uppercase">
                      Why are you rejecting this?
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This helps the AI learn your voice. Be specific — e.g. &quot;I never debate lock vs float&quot; or &quot;too corporate sounding&quot;
                    </p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="What's wrong with this post..."
                      className="w-full rounded-lg p-3 text-sm resize-none bg-background text-foreground border border-input min-h-[60px] focus:outline-none focus:ring-1 focus:ring-destructive"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={handleRejectSubmit} disabled={!rejectReason.trim()}>
                        Reject
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowRejectModal(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Agent Notes */}
          {draft.agent_notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-[11px] font-semibold tracking-widest text-primary uppercase">
                  Agent Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-[11px] leading-relaxed whitespace-pre-wrap">
                  {draft.agent_notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* ── Chat Panel (pinned to bottom) ── */}
      <div className="border-t border-input bg-card/50 p-4 space-y-2.5">
        <div className="text-[10px] font-semibold tracking-widest text-primary uppercase">
          Chat — Editing &lsquo;{draft.title || 'Untitled'}&rsquo;
        </div>

        {messages.length > 0 && (
          <ScrollArea className="max-h-40">
            <div className="space-y-1.5">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'text-xs rounded-lg px-3 py-2',
                    msg.role === 'user'
                      ? 'bg-primary/5 border-l-2 border-l-input'
                      : 'bg-card border-l-2 border-l-primary',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'font-semibold text-[9px] tracking-wider uppercase',
                      msg.role === 'user' ? 'text-muted-foreground' : 'text-primary',
                    )}>
                      {msg.role === 'user' ? 'You' : 'Claude'}
                    </span>
                    {msg.role === 'assistant' && (
                      <Button
                        size="sm"
                        className="h-5 px-2 text-[9px] tracking-wider"
                        onClick={() => onUpdate({ ...draft, content: msg.content })}
                      >
                        Apply to Post
                      </Button>
                    )}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-foreground/80">{msg.content}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleChatSend()
              }
            }}
            placeholder="Tell Claude how to edit this post..."
            disabled={chatLoading}
            className="flex-1 bg-background border border-input text-foreground text-xs rounded-lg px-3 py-2 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
          <Button
            size="sm"
            onClick={handleChatSend}
            disabled={chatLoading || !chatInput.trim()}
          >
            {chatLoading ? '...' : 'Send'}
          </Button>
        </div>

        <p className="text-muted-foreground text-[10px]">
          Claude sees this post + your voice guide automatically
        </p>
      </div>

      {/* Platform preview modal */}
      {showPreview && (
        <SocialPostPreview
          draft={draft}
          signedMediaUrls={signedMediaUrls}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
