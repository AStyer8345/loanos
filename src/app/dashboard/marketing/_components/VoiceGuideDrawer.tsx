'use client'

import { useState, useEffect, useCallback } from 'react'

const GOLD = '#C9A84C'

type Props = {
  open: boolean
  onClose: () => void
  onEditFullTab?: () => void
}

export default function VoiceGuideDrawer({ open, onClose, onEditFullTab }: Props) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchGuide = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/social/settings?key=voice_guide')
      const data = await res.json()
      setContent(data.value ?? null)
    } catch {
      setContent(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchGuide()
    }
  }, [open, fetchGuide])

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full w-[480px] max-w-[90vw] bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="text-xs font-bold tracking-widest" style={{ color: GOLD }}>
            VOICE GUIDE
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-zinc-600 text-xs tracking-widest">LOADING...</span>
            </div>
          ) : content ? (
            <pre
              className="text-zinc-300 whitespace-pre-wrap break-words"
              style={{ fontSize: '12px', lineHeight: '1.7' }}
            >
              {content}
            </pre>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-zinc-600 text-xs">No voice guide configured.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-zinc-800">
          <button
            onClick={onEditFullTab}
            className="w-full px-4 py-2 text-xs font-bold tracking-widest rounded-sm transition-colors border border-zinc-700 text-zinc-300 hover:text-zinc-100 hover:border-zinc-500"
          >
            EDIT IN FULL TAB
          </button>
        </div>
      </div>
    </>
  )
}
