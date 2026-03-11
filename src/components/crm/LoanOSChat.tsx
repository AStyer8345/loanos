'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Props = {
  recordId: string
  recordType: 'contact' | 'loan'
  recordName: string
}

const QUICK_ACTIONS: Record<string, string[]> = {
  contact: [
    'Draft a check-in email',
    'What should my next action be?',
    'Write a text message',
    'Summarize this contact',
  ],
  loan: [
    'What needs attention on this file?',
    'Draft an update email to the realtor',
    'How many days until close?',
    'Write a borrower status update',
  ],
}

const ACCENT = '#C9A84C'
const BG = '#0f0f0f'
const SURFACE = '#1a1a1a'
const BORDER = '#2a2a2a'
const FONT = '"IBM Plex Mono", "Courier New", monospace'

export default function LoanOSChat({ recordId, recordType, recordName }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const loadHistory = useCallback(async () => {
    if (historyLoaded) return
    try {
      const res = await fetch(
        `/api/chat?recordId=${encodeURIComponent(recordId)}&recordType=${encodeURIComponent(recordType)}`
      )
      const data = await res.json()
      if (data.messages?.length) {
        setMessages(data.messages)
        setSessionId(data.sessionId)
      }
    } catch {
      // silently ignore — chat still works without history
    } finally {
      setHistoryLoaded(true)
    }
  }, [recordId, recordType, historyLoaded])

  useEffect(() => {
    if (isOpen) loadHistory()
  }, [isOpen, loadHistory])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  async function sendMessage(text: string) {
    if (!text.trim() || isLoading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, recordId, recordType, sessionId }),
      })
      const data = await res.json()
      if (data.message) {
        setMessages((prev) => [...prev, data.message])
        if (data.sessionId) setSessionId(data.sessionId)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Error: failed to reach assistant. Try again.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Open AI Assistant"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: ACCENT,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          color: '#000',
          boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
          transition: 'transform 0.15s ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = 'scale(1)')}
      >
        ◈
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            zIndex: 9998,
            width: 380,
            height: 560,
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            fontFamily: FONT,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: `1px solid ${BORDER}`,
              background: BG,
            }}
          >
            <div>
              <div style={{ color: ACCENT, fontSize: 12, fontWeight: 600, letterSpacing: '0.08em' }}>
                LOANOSIS AI
              </div>
              <div style={{ color: '#666', fontSize: 11, marginTop: 2 }}>
                {recordName && <span>{recordName} · </span>}
                <span style={{ textTransform: 'capitalize' }}>{recordType}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    setMessages([])
                    setSessionId(null)
                    setHistoryLoaded(false)
                  }}
                  title="Clear chat"
                  style={{
                    background: 'none',
                    border: `1px solid ${BORDER}`,
                    borderRadius: 6,
                    color: '#666',
                    cursor: 'pointer',
                    fontSize: 11,
                    padding: '3px 8px',
                    fontFamily: FONT,
                  }}
                >
                  clear
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: 18,
                  lineHeight: 1,
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {messages.length === 0 && !isLoading && (
              <div>
                <div style={{ color: '#444', fontSize: 11, marginBottom: 12, textAlign: 'center' }}>
                  Ask anything about this {recordType}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {QUICK_ACTIONS[recordType]?.map((action) => (
                    <button
                      key={action}
                      onClick={() => sendMessage(action)}
                      style={{
                        background: BG,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 6,
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: 11,
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontFamily: FONT,
                        transition: 'border-color 0.1s, color 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = ACCENT
                        el.style.color = ACCENT
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement
                        el.style.borderColor = BORDER
                        el.style.color = '#888'
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '8px 12px',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: msg.role === 'user' ? ACCENT : BG,
                    color: msg.role === 'user' ? '#000' : '#ccc',
                    fontSize: 12,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    border: msg.role === 'assistant' ? `1px solid ${BORDER}` : 'none',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '12px 12px 12px 2px',
                    background: BG,
                    border: `1px solid ${BORDER}`,
                    color: '#555',
                    fontSize: 12,
                    letterSpacing: '0.3em',
                  }}
                >
                  ···
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            style={{
              borderTop: `1px solid ${BORDER}`,
              padding: '10px 12px',
              background: BG,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything… (Enter to send)"
              rows={1}
              style={{
                flex: 1,
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                color: '#ddd',
                fontFamily: FONT,
                fontSize: 12,
                lineHeight: 1.5,
                outline: 'none',
                padding: '8px 10px',
                resize: 'none',
                maxHeight: 96,
                overflowY: 'auto',
              }}
              onInput={(e) => {
                const el = e.currentTarget as HTMLTextAreaElement
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 96) + 'px'
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              style={{
                background: input.trim() && !isLoading ? ACCENT : '#2a2a2a',
                border: 'none',
                borderRadius: 8,
                color: input.trim() && !isLoading ? '#000' : '#444',
                cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                fontSize: 16,
                height: 36,
                width: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.15s',
                flexShrink: 0,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </>
  )
}
