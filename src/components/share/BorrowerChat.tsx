'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { GOLD, TEXT, MUTED, CARD_BG, BORDER } from './constants'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface BorrowerChatProps {
  token: string
}

const MAX_TURNS = 3

export default function BorrowerChat({ token }: BorrowerChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const userTurnCount = messages.filter(m => m.role === 'user').length
  const canAsk = userTurnCount < MAX_TURNS

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function send() {
    const q = input.trim()
    if (!q || loading || !canAsk) return

    const optimistic: Message[] = [...messages, { role: 'user', content: q }]
    setMessages(optimistic)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/share/${token}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, history: messages.slice(-6) }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        if (res.status === 429) throw new Error('Too many questions — try again in a minute.')
        throw new Error(err.error || 'Failed to get answer.')
      }

      const { answer } = await res.json() as { answer: string }
      setMessages(prev => [...prev, { role: 'assistant', content: answer }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setMessages(messages)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const remainingTurns = MAX_TURNS - userTurnCount

  return (
    <div
      className="rounded-2xl overflow-hidden print:hidden"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-3 mb-0.5">
          <div style={{ width: 16, height: 1, background: GOLD }} />
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: GOLD }}>
            Ask a Question
          </p>
        </div>
        <p className="text-xs ml-7" style={{ color: MUTED }}>
          Have a question about your numbers? Ask below — answers are specific to your scenario.
        </p>
      </div>

      {/* Message thread */}
      {messages.length > 0 && (
        <div className="px-5 pb-2 space-y-3 max-h-[360px] overflow-y-auto">
          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="flex justify-end">
                <div
                  className="max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed"
                  style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}30`, color: TEXT }}
                >
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-2.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}
                >
                  <MessageSquare size={10} style={{ color: GOLD }} />
                </div>
                <p className="text-xs leading-relaxed flex-1 pt-0.5" style={{ color: MUTED }}>
                  {m.content}
                </p>
              </div>
            )
          )}

          {loading && (
            <div className="flex gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}40` }}
              >
                <MessageSquare size={10} style={{ color: GOLD }} />
              </div>
              <div className="flex items-center gap-1 pt-1.5">
                {[0, 1, 2].map(d => (
                  <div
                    key={d}
                    className="w-1.5 h-1.5 rounded-full animate-bounce"
                    style={{ background: GOLD, opacity: 0.6, animationDelay: `${d * 150}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="px-5 pb-2 text-xs" style={{ color: '#C94C4C' }}>{error}</p>
      )}

      {/* Input row */}
      <div className="px-5 pb-5 pt-3">
        {!canAsk ? (
          <p className="text-xs text-center py-2" style={{ color: MUTED }}>
            Contact your loan officer for more questions.
          </p>
        ) : (
          <div
            className="flex items-center gap-2 rounded-xl overflow-hidden"
            style={{ border: `1px solid ${BORDER}`, background: '#0a0a0a' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. What does the break-even mean?"
              disabled={loading}
              maxLength={500}
              className="flex-1 bg-transparent text-xs px-3 py-3 outline-none"
              style={{ color: TEXT, caretColor: GOLD }}
            />
            <button
              onClick={() => void send()}
              disabled={!input.trim() || loading}
              className="px-3 py-3 flex-shrink-0 transition-opacity disabled:opacity-40"
              style={{ color: GOLD }}
              aria-label="Send question"
            >
              <Send size={14} />
            </button>
          </div>
        )}
        {canAsk && userTurnCount > 0 && (
          <p className="text-[10px] text-center mt-2" style={{ color: MUTED }}>
            {remainingTurns} question{remainingTurns !== 1 ? 's' : ''} remaining
          </p>
        )}
      </div>
    </div>
  )
}
