'use client'

import { useEffect, useMemo, useState, type CSSProperties } from 'react'

import type { SocialDraft } from './SocialDraftList'

type Props = {
  draft: SocialDraft
  signedMediaUrls: string[]
  onClose: () => void
}

type Platform = 'facebook' | 'instagram' | 'linkedin'

const GOLD = '#C9A84C'
const OVERLAY_BG = 'rgba(10, 10, 10, 0.8)'
const OUTER_FONT = "'IBM Plex Mono', 'Courier New', monospace"
const PREVIEW_FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

function normalizePlatform(platform: string | null | undefined): Platform | 'all' {
  const normalized = platform?.toLowerCase()
  if (normalized === 'instagram' || normalized === 'linkedin' || normalized === 'facebook') {
    return normalized
  }
  return 'all'
}

type ParsedSlide = { num: number; title: string; body: string }

function parseContent(content: string | null): {
  postText: string
  firstComment: string | null
  caption: string
  slides: ParsedSlide[]
} {
  if (!content) return { postText: '', firstComment: null, caption: '', slides: [] }

  const normalized = content.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  let commentIndex = -1
  let inlineComment = ''

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const match = line.match(/^\s*first comment\b(?:\s*\([^)]*\))?\s*:?\s*(.*)$/i)
    if (match) {
      commentIndex = index
      inlineComment = match[1]?.trim() ?? ''
      break
    }
  }

  // Strip metadata lines and design briefs
  const metadataPattern = /^\s*(?:#{1,3}\s+)?(?:\*\*)?(?:TITLE|PLATFORM|FORMAT|PILLAR|CURRENT CONTENT|CAPTION(\s*\(.*?\))?)(?:\*\*)?\s*:?/i
  // Cut off content at design brief / hashtags section
  const designBriefPattern = /\n---\s*\n+\s*(?:#{1,3}\s+)?(?:CANVA|DESIGN)\s+(?:DESIGN\s+)?BRIEF/i
  const hashtagSectionPattern = /\n---\s*\n+\s*\*\*Hashtags?\*\*\s*:/i
  // Also strip post title headers like "# Post 22 — VA Loan Myths"
  const postTitlePattern = /^\s*#{1,3}\s+Post\s+\d+\s*[—–:-].*/i

  let rawContent = (commentIndex >= 0 ? lines.slice(0, commentIndex) : lines).join('\n')

  // Remove design brief and everything after it
  const briefIdx = rawContent.search(designBriefPattern)
  if (briefIdx > 0) rawContent = rawContent.substring(0, briefIdx)

  // Remove hashtag section divider
  const hashIdx = rawContent.search(hashtagSectionPattern)
  if (hashIdx > 0) rawContent = rawContent.substring(0, hashIdx)

  const bodyContent = rawContent
    .split('\n')
    .filter((line) => !metadataPattern.test(line) && !postTitlePattern.test(line))
    .join('\n')
    .replace(/^---\s*$/gm, '') // remove horizontal rules
    .replace(/\n{3,}/g, '\n\n') // collapse excess blank lines
    .trim()

  const commentLines = commentIndex >= 0 ? lines.slice(commentIndex + 1) : []
  const firstComment = [inlineComment, ...commentLines].join('\n').trim() || null

  // Parse carousel slides — supports ALL agent formats:
  //   SLIDE 1 — HOOK           (carousel builder)
  //   **SLIDE 1 — HOOK**       (bold markdown)
  //   [Slide 1 — Hook]         (bracket format)
  //   ## Slide 1 — Hook        (markdown header - agent format)
  //   ## Slide 1: Hook         (colon variant)
  const slideRegex = /(?:^|\n)\s*(?:#{1,3}\s+)?(?:\*\*|\[)?SLIDE\s+(\d+)(?:\s*[—–:\-]\s*([^\n\]*]*))?(?:\*\*|\])?\s*\n([\s\S]*?)(?=(?:\n\s*(?:#{1,3}\s+)?(?:\*\*|\[)?SLIDE\s+\d)|$)/gi
  const slides: ParsedSlide[] = []
  let slideMatch: RegExpExecArray | null

  while ((slideMatch = slideRegex.exec(bodyContent)) !== null) {
    const num = parseInt(slideMatch[1], 10)
    const title = (slideMatch[2] || '').trim().replace(/\*\*/g, '').replace(/\]$/, '')
    let body = (slideMatch[3] || '').trim().replace(/^\n+|\n+$/g, '')
    // Clean markdown bold from body content for display
    body = body.replace(/\*\*([^*]+)\*\*/g, '$1')
    if (body || title) {
      slides.push({ num, title, body })
    }
  }

  // Caption = everything before first SLIDE block
  const firstSlideIdx = bodyContent.search(/(?:^|\n)\s*(?:#{1,3}\s+)?(?:\*\*|\[)?SLIDE\s+1\b/i)
  const caption = firstSlideIdx > 0 ? bodyContent.substring(0, firstSlideIdx).trim() : ''

  // For non-carousel: strip slide prefixes from body text
  const postText = slides.length >= 2
    ? caption
    : bodyContent.replace(/^\s*(?:#{1,3}\s+)?\[?\s*slide\s+\d+\s*[—–:\-]\s*[^\]]*\]?\s*/gim, '').trim()

  return { postText, firstComment, caption, slides }
}

function getLineClamp(expanded: boolean): CSSProperties {
  if (expanded) return {}
  return {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 4,
    overflow: 'hidden',
  }
}

function PlatformTab({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        appearance: 'none',
        border: 'none',
        background: active ? '#ffffff' : 'transparent',
        color: active ? '#111118' : '#a1a1aa',
        borderRadius: 999,
        padding: '8px 12px',
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        fontFamily: OUTER_FONT,
      }}
    >
      {label}
    </button>
  )
}

function SocialHeader({
  platform,
}: {
  platform: Platform
}) {
  const accent =
    platform === 'facebook'
      ? '#1877F2'
      : platform === 'instagram'
        ? 'linear-gradient(90deg, #833AB4 0%, #E1306C 50%, #F77737 100%)'
        : '#0A66C2'

  return (
    <div
      style={{
        height: 7,
        background: accent,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    />
  )
}

function ProfileBlock() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: GOLD,
          color: '#111118',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        AS
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#111118' }}>Adam Styer</div>
        <div style={{ fontSize: 13, color: '#6b7280' }}>Mortgage Solutions LP</div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Just now</div>
      </div>
    </div>
  )
}

function EngagementBar({ platform }: { platform: Platform }) {
  if (platform === 'instagram') {
    return (
      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#111118',
            fontSize: 14,
            lineHeight: 1,
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span>heart</span>
            <span>comment</span>
            <span>share</span>
          </div>
          <span>save</span>
        </div>
        <div style={{ marginTop: 10, color: '#111118', fontSize: 13, fontWeight: 600 }}>0 likes</div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        borderTop: '1px solid #e5e7eb',
        paddingTop: 12,
        color: '#6b7280',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span>Like</span>
      <span>Comment</span>
      <span>Share</span>
    </div>
  )
}

function MediaBlock({
  mediaUrls,
  platform,
}: {
  mediaUrls: string[]
  platform: Platform
}) {
  if (mediaUrls.length === 0) return null

  const primaryUrl = mediaUrls[0]
  const extraCount = mediaUrls.length - 1
  const isInstagram = platform === 'instagram'

  return (
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 16,
          background: '#f3f4f6',
          aspectRatio: isInstagram ? '1 / 1' : mediaUrls.length > 1 ? '16 / 10' : '16 / 11',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryUrl}
          alt="Social post media preview"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        {extraCount > 0 && (
          <div
            style={{
              position: 'absolute',
              right: 12,
              bottom: 12,
              background: 'rgba(17, 17, 24, 0.75)',
              color: '#ffffff',
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 16,
              fontWeight: 700,
              backdropFilter: 'blur(8px)',
            }}
          >
            +{extraCount}
          </div>
        )}
      </div>
      {isInstagram && mediaUrls.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
          {mediaUrls.map((url, index) => (
            <span
              key={`${url}-${index}`}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: index === 0 ? '#0A66C2' : '#d1d5db',
                display: 'block',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/** Branded carousel slide preview — matches the visual style of social carousel posts */
function CarouselSlidePreview({
  slide,
  total,
  slideIndex,
  onPrev,
  onNext,
}: {
  slide: ParsedSlide
  total: number
  slideIndex: number
  onPrev: () => void
  onNext: () => void
}) {
  const isFirst = slide.num === 1
  const isLast = slide.num === total
  const isCTA = isLast || /cta/i.test(slide.title)
  const bodyLines = slide.body.split('\n').filter(Boolean)

  return (
    <div>
      {/* The slide card */}
      <div
        style={{
          background: '#0a0a0a',
          borderRadius: 16,
          border: isCTA ? `1px solid ${GOLD}` : '1px solid #1a1a1a',
          aspectRatio: '1 / 1',
          padding: isFirst ? '32px 28px' : '24px 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontFamily: PREVIEW_FONT,
        }}
      >
        {/* Top: slide number */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: '#52525b', fontSize: 9, fontWeight: 700, letterSpacing: '0.15em' }}>
            SLIDE {slide.num} OF {total}
          </span>
          {slide.title && !isFirst && (
            <span style={{ color: GOLD, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em' }}>
              {slide.title.toUpperCase()}
            </span>
          )}
        </div>

        {/* Middle: content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {isFirst ? (
            <>
              <div style={{ color: GOLD, fontSize: 20, fontWeight: 700, lineHeight: 1.25, marginBottom: 12 }}>
                {bodyLines[0] || ''}
              </div>
              {bodyLines.length > 1 && (
                <div style={{ color: '#e4e4e7', fontSize: 13, lineHeight: 1.6 }}>
                  {bodyLines.slice(1).join('\n')}
                </div>
              )}
            </>
          ) : isCTA ? (
            <div style={{ textAlign: 'center' }}>
              {bodyLines.map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: i === 0 ? GOLD : '#a1a1aa',
                    fontSize: i === 0 ? 16 : 12,
                    fontWeight: i === 0 ? 700 : 400,
                    lineHeight: 1.5,
                    marginBottom: 8,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#e4e4e7', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {slide.body}
            </div>
          )}
        </div>

        {/* Bottom: branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid #1a1a1a' }}>
          <span style={{ color: '#52525b', fontSize: 9, letterSpacing: '0.05em' }}>
            Adam Styer | Mortgage Solutions LP
          </span>
          {isCTA && (
            <span style={{ color: GOLD, fontSize: 9, fontWeight: 700 }}>NMLS# 513013</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }}>
        <button
          onClick={onPrev}
          disabled={slideIndex === 0}
          style={{
            appearance: 'none',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#18181b',
            color: '#fff',
            border: '1px solid #3f3f46',
            cursor: slideIndex === 0 ? 'default' : 'pointer',
            opacity: slideIndex === 0 ? 0.2 : 1,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          &#8592;
        </button>

        {/* Dot indicators */}
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              style={{
                width: i === slideIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === slideIndex ? GOLD : '#3f3f46',
                transition: 'all 0.2s',
                display: 'block',
              }}
            />
          ))}
        </div>

        <button
          onClick={onNext}
          disabled={slideIndex === total - 1}
          style={{
            appearance: 'none',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#18181b',
            color: '#fff',
            border: '1px solid #3f3f46',
            cursor: slideIndex === total - 1 ? 'default' : 'pointer',
            opacity: slideIndex === total - 1 ? 0.2 : 1,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          &#8594;
        </button>
      </div>
    </div>
  )
}

export default function SocialPostPreview({ draft, signedMediaUrls, onClose }: Props) {
  const detectedPlatform = normalizePlatform(draft.platform)
  const [platform, setPlatform] = useState<Platform>(
    detectedPlatform === 'all' ? 'facebook' : detectedPlatform,
  )
  const [expanded, setExpanded] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)

  useEffect(() => {
    setPlatform(detectedPlatform === 'all' ? 'facebook' : detectedPlatform)
  }, [detectedPlatform])

  useEffect(() => {
    setExpanded(false)
    setSlideIndex(0)
  }, [draft.id, platform])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const { postText, firstComment, caption, slides } = useMemo(() => parseContent(draft.content), [draft.content])
  const isCarousel = slides.length >= 2
  const mediaUrls = useMemo(
    () => signedMediaUrls.filter((url): url is string => Boolean(url)),
    [signedMediaUrls],
  )
  const showTabs = detectedPlatform === 'all'
  const displayText = isCarousel ? caption : postText
  const showMore = displayText.length > 280

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: OVERLAY_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: OUTER_FONT,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 540,
          maxHeight: '92vh',
          overflow: 'auto',
          borderRadius: 28,
          background: '#111118',
          color: '#ffffff',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '18px 18px 10px',
          }}
        >
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', color: '#a1a1aa' }}>POST PREVIEW</div>
            <div style={{ fontSize: 14, color: '#ffffff', marginTop: 4 }}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close preview"
            style={{
              appearance: 'none',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: '#18181b',
              color: '#ffffff',
              width: 34,
              height: 34,
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            x
          </button>
        </div>

        {showTabs && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: '0 18px 14px',
            }}
          >
            <PlatformTab active={platform === 'facebook'} label="Facebook" onClick={() => setPlatform('facebook')} />
            <PlatformTab active={platform === 'instagram'} label="Instagram" onClick={() => setPlatform('instagram')} />
            <PlatformTab active={platform === 'linkedin'} label="LinkedIn" onClick={() => setPlatform('linkedin')} />
          </div>
        )}

        <div style={{ padding: '0 18px 18px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: 24,
              overflow: 'hidden',
              fontFamily: PREVIEW_FONT,
              border: '1px solid #e5e7eb',
            }}
          >
            <SocialHeader platform={platform} />

            <div style={{ padding: 18 }}>
              <ProfileBlock />

              {/* Caption / post text */}
              {displayText && (
                <div style={{ marginTop: 16, color: '#111118', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  <div style={getLineClamp(expanded)}>
                    {displayText}
                  </div>
                  {!expanded && showMore && (
                    <button
                      onClick={() => setExpanded(true)}
                      style={{
                        appearance: 'none',
                        border: 'none',
                        background: 'transparent',
                        color: '#6b7280',
                        padding: 0,
                        marginTop: 6,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ...more
                    </button>
                  )}
                </div>
              )}

              {draft.hashtags && (
                <div
                  style={{
                    marginTop: 12,
                    color: '#6b7280',
                    fontSize: 14,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {draft.hashtags}
                </div>
              )}

              {/* Carousel slides or media */}
              {isCarousel ? (
                <div style={{ marginTop: 16 }}>
                  <CarouselSlidePreview
                    slide={slides[Math.min(slideIndex, slides.length - 1)]}
                    total={slides.length}
                    slideIndex={slideIndex}
                    onPrev={() => setSlideIndex((i) => Math.max(0, i - 1))}
                    onNext={() => setSlideIndex((i) => Math.min(slides.length - 1, i + 1))}
                  />
                </div>
              ) : (
                <MediaBlock mediaUrls={mediaUrls} platform={platform} />
              )}

              <div style={{ marginTop: 16 }}>
                <EngagementBar platform={platform} />
              </div>
            </div>
          </div>

          {firstComment && (
            <div
              style={{
                marginTop: 14,
                background: '#ffffff',
                borderRadius: 20,
                border: '1px solid #e5e7eb',
                padding: 16,
                fontFamily: PREVIEW_FONT,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: GOLD,
                    color: '#111118',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 12,
                    flexShrink: 0,
                  }}
                >
                  AS
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111118' }}>Adam Styer</div>
                  <div
                    style={{
                      marginTop: 6,
                      color: '#374151',
                      fontSize: 14,
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {firstComment}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>Pinned comment</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
