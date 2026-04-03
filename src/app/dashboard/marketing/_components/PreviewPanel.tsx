'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, SectionLabel } from './shared'

const GOLD = 'var(--primary)'

type PreviewTab = 'borrower-email' | 'realtor-email' | 'web-content'

type Props = {
  pageUrl:           string
  borrowerSubject?:  string | null
  borrowerPreheader?: string | null
  borrowerEmailHtml?: string | null
  realtorSubject?:   string | null
  realtorPreheader?: string | null
  realtorEmailHtml?: string | null
  webContent?:       string | null
  /** Extra fields like linkedinPost, facebookPost */
  socialDrafts?: { platform: string; content: string }[]
  /** Status message shown after publish */
  statusMessage?: string | null
}

function EmailIframe({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(400)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { margin: 0; padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #333; }
          img { max-width: 100%; height: auto; }
          a { color: #c8a55a; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `)
    doc.close()

    // Auto-resize iframe to content height
    const resize = () => {
      const body = doc.body
      const docEl = doc.documentElement
      if (body && docEl) {
        const h = Math.max(body.scrollHeight, docEl.scrollHeight, 200)
        setHeight(Math.min(h, 800))
      }
    }

    // Resize after images load
    const imgs = doc.querySelectorAll('img')
    let loaded = 0
    const totalImgs = imgs.length
    if (totalImgs === 0) {
      setTimeout(resize, 50)
    } else {
      imgs.forEach(img => {
        img.addEventListener('load', () => { loaded++; if (loaded >= totalImgs) resize() })
        img.addEventListener('error', () => { loaded++; if (loaded >= totalImgs) resize() })
      })
      setTimeout(resize, 100)
    }

    setTimeout(resize, 300)
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      style={{
        width: '100%',
        height,
        border: '1px solid var(--border)',
        borderRadius: 4,
        background: '#fff',
      }}
      title="Email preview"
    />
  )
}

function WebContentPreview({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(400)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    doc.open()
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { margin: 0; padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fff; color: #333; line-height: 1.6; }
          img { max-width: 100%; height: auto; }
          a { color: #c8a55a; }
          h1, h2, h3 { color: #1a1a1a; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `)
    doc.close()

    const resize = () => {
      const body = doc.body
      const docEl = doc.documentElement
      if (body && docEl) {
        const h = Math.max(body.scrollHeight, docEl.scrollHeight, 200)
        setHeight(Math.min(h, 800))
      }
    }
    setTimeout(resize, 100)
    setTimeout(resize, 500)
  }, [html])

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      style={{
        width: '100%',
        height,
        border: '1px solid var(--border)',
        borderRadius: 4,
        background: '#fff',
      }}
      title="Web content preview"
    />
  )
}

export default function PreviewPanel({
  pageUrl,
  borrowerSubject,
  borrowerPreheader,
  borrowerEmailHtml,
  realtorSubject,
  realtorPreheader,
  realtorEmailHtml,
  webContent,
  socialDrafts,
  statusMessage,
}: Props) {
  // Determine available tabs
  const availableTabs: { key: PreviewTab; label: string }[] = []
  if (borrowerEmailHtml) availableTabs.push({ key: 'borrower-email', label: 'Borrower Email' })
  if (realtorEmailHtml)  availableTabs.push({ key: 'realtor-email',  label: 'Realtor Email' })
  if (webContent)        availableTabs.push({ key: 'web-content',    label: 'Web Page' })

  const [activeTab, setActiveTab] = useState<PreviewTab>(
    availableTabs[0]?.key ?? 'borrower-email'
  )

  // Reset active tab if it becomes unavailable
  const validTab = availableTabs.find(t => t.key === activeTab) ? activeTab : availableTabs[0]?.key

  return (
    <Card className="sticky top-4">
      <SectionLabel>PREVIEW</SectionLabel>

      {/* Status message (after publish) */}
      {statusMessage && (
        <div
          className="text-xs font-bold px-2 py-1.5 rounded-sm mb-3"
          style={{ background: '#4CAF8218', border: '1px solid #4CAF82', color: '#4CAF82' }}
        >
          {statusMessage}
        </div>
      )}

      {/* URL */}
      <div className="mb-3 text-xs">
        <span className="text-muted-foreground">URL: </span>
        {pageUrl ? (
          <a href={pageUrl} target="_blank" rel="noopener noreferrer" style={{ color: GOLD }}>
            {pageUrl}
          </a>
        ) : (
          <span className="text-muted-foreground italic">Generated on publish</span>
        )}
      </div>

      {/* Subject lines */}
      <div className="space-y-1 mb-3 text-xs">
        {borrowerSubject && (
          <div>
            <span className="text-muted-foreground">Borrower: </span>
            <span className="text-foreground font-bold">{borrowerSubject}</span>
            {borrowerPreheader && (
              <span className="text-muted-foreground ml-1">— {borrowerPreheader}</span>
            )}
          </div>
        )}
        {realtorSubject && (
          <div>
            <span className="text-muted-foreground">Realtor: </span>
            <span className="text-foreground font-bold">{realtorSubject}</span>
            {realtorPreheader && (
              <span className="text-muted-foreground ml-1">— {realtorPreheader}</span>
            )}
          </div>
        )}
      </div>

      {/* Tab bar */}
      {availableTabs.length > 0 && (
        <>
          <div className="flex border-b border-input mb-3">
            {availableTabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="px-3 py-1.5 text-xs font-bold tracking-wide transition-colors relative"
                style={{
                  color: validTab === key ? GOLD : 'var(--muted-foreground)',
                  fontFamily: 'inherit',
                }}
              >
                {label}
                {validTab === key && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-px"
                    style={{ background: GOLD }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {validTab === 'borrower-email' && borrowerEmailHtml && (
            <EmailIframe html={borrowerEmailHtml} />
          )}
          {validTab === 'realtor-email' && realtorEmailHtml && (
            <EmailIframe html={realtorEmailHtml} />
          )}
          {validTab === 'web-content' && webContent && (
            <WebContentPreview html={webContent} />
          )}
        </>
      )}

      {/* Fallback if no HTML content */}
      {availableTabs.length === 0 && (
        <div className="text-xs text-muted-foreground py-4 text-center">
          No preview content available. Subject lines and URL are shown above.
        </div>
      )}

      {/* Social drafts */}
      {socialDrafts && socialDrafts.length > 0 && (
        <div className="mt-3 space-y-2">
          {socialDrafts.map(({ platform, content }) => (
            <details key={platform} className="text-xs">
              <summary className="text-muted-foreground cursor-pointer font-bold">
                {platform} draft
              </summary>
              <p className="mt-1 text-foreground/80 leading-relaxed whitespace-pre-wrap pl-2 border-l border-input">
                {content}
              </p>
            </details>
          ))}
        </div>
      )}
    </Card>
  )
}
