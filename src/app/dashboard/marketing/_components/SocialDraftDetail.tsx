'use client'

import { useState } from 'react'
import type { SocialDraft } from './SocialDraftList'

const GOLD = '#C9A84C'

type Props = {
  draft: SocialDraft
  onUpdate: (draft: SocialDraft) => void
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

export default function SocialDraftDetail({ draft, onUpdate, onOpenVoiceGuide }: Props) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(draft.content || '')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Reset edit state when draft changes
  const [prevId, setPrevId] = useState(draft.id)
  if (draft.id !== prevId) {
    setPrevId(draft.id)
    setEditing(false)
    setEditContent(draft.content || '')
    setMessages([])
    setChatInput('')
  }

  function handleEdit() {
    setEditing(true)
    setEditContent(draft.content || '')
  }

  function handleSave() {
    setEditing(false)
    onUpdate({ ...draft, content: editContent })
  }

  function handleApprove() {
    onUpdate({ ...draft, status: 'approved' })
  }

  function handleReject() {
    onUpdate({ ...draft, status: 'rejected' })
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
        body: JSON.stringify({
          messages: nextMessages,
          draftId: draft.id,
        }),
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
    .join(' \u00B7 ')

  return (
    <div
      className="flex flex-col h-full"
      style={{ fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}
    >
      {/* 1. Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div>
          <div className="text-white font-bold" style={{ fontSize: 15 }}>
            {draft.title || 'Untitled'}
          </div>
          <div className="text-zinc-500" style={{ fontSize: 11 }}>
            {subtitle}
          </div>
        </div>
        <button
          onClick={onOpenVoiceGuide}
          className="px-3 py-1 rounded-sm text-xs font-bold tracking-wider transition-opacity hover:opacity-80"
          style={{
            background: 'transparent',
            color: GOLD,
            border: `1px solid ${GOLD}`,
            fontFamily: 'inherit',
          }}
        >
          VOICE GUIDE
        </button>
      </div>

      {/* 2. Content area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Post content */}
        <div>
          <div
            className="font-bold mb-2"
            style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
          >
            POST CONTENT
          </div>

          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full rounded-md border border-zinc-800 text-zinc-100 text-xs px-3 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 resize-none"
                style={{ background: '#111118', fontFamily: 'inherit', lineHeight: 1.6 }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
                  style={{ background: GOLD, color: '#09090b', fontFamily: 'inherit' }}
                >
                  SAVE
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1 rounded-sm text-xs font-bold text-zinc-500 transition-opacity hover:opacity-80"
                  style={{ border: '1px solid #3f3f46', fontFamily: 'inherit' }}
                >
                  CANCEL
                </button>
              </div>
            </div>
          ) : (
            <div
              className="rounded-md border border-zinc-800 px-3 py-2.5 text-zinc-300 whitespace-pre-wrap"
              style={{ background: '#111118', fontSize: 12, lineHeight: 1.6 }}
            >
              {draft.content || '(empty)'}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!editing && (
          <div className="flex gap-2">
            <button
              onClick={handleApprove}
              className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
              style={{
                background: 'transparent',
                color: '#4CAF82',
                border: '1px solid #4CAF82',
                fontFamily: 'inherit',
              }}
            >
              APPROVE
            </button>
            <button
              onClick={handleEdit}
              className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
              style={{
                background: 'transparent',
                color: '#3B82F6',
                border: '1px solid #3B82F6',
                fontFamily: 'inherit',
              }}
            >
              EDIT
            </button>
            <button
              onClick={handleReject}
              className="px-3 py-1 rounded-sm text-xs font-bold transition-opacity hover:opacity-80"
              style={{
                background: 'transparent',
                color: '#E05252',
                border: '1px solid #E05252',
                fontFamily: 'inherit',
              }}
            >
              REJECT
            </button>
          </div>
        )}

        {/* Agent notes */}
        {draft.agent_notes && (
          <div>
            <div
              className="font-bold mb-2"
              style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
            >
              AGENT NOTES
            </div>
            <div
              className="rounded-md border border-zinc-800 px-3 py-2.5 text-zinc-500 whitespace-pre-wrap"
              style={{ background: '#111118', fontSize: 11, lineHeight: 1.5 }}
            >
              {draft.agent_notes}
            </div>
          </div>
        )}
      </div>

      {/* 3. Chat panel */}
      <div className="border-t border-zinc-800 p-3 space-y-2">
        <div
          className="font-bold"
          style={{ color: GOLD, fontSize: 10, letterSpacing: '0.2em' }}
        >
          CHAT &mdash; EDITING &lsquo;{draft.title || 'Untitled'}&rsquo;
        </div>

        {/* Message list */}
        {messages.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-1.5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className="text-xs rounded-sm px-2 py-1.5"
                style={{
                  background: msg.role === 'user' ? '#1a1a2e' : '#111118',
                  color: msg.role === 'user' ? '#e4e4e7' : '#a1a1aa',
                  borderLeft: msg.role === 'assistant' ? `2px solid ${GOLD}` : '2px solid #3f3f46',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold" style={{ fontSize: 9, color: msg.role === 'user' ? '#71717a' : GOLD }}>
                    {msg.role === 'user' ? 'YOU' : 'CLAUDE'}
                  </span>
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => onUpdate({ ...draft, content: msg.content })}
                      className="px-2 py-0.5 rounded-sm font-bold transition-opacity hover:opacity-80"
                      style={{
                        fontSize: 9,
                        letterSpacing: '0.1em',
                        background: GOLD,
                        color: '#09090b',
                        fontFamily: 'inherit',
                      }}
                    >
                      APPLY TO POST
                    </button>
                  )}
                </div>
                <div className="mt-0.5 whitespace-pre-wrap">{msg.content}</div>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
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
            className="flex-1 bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs rounded-sm px-2 py-1.5 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 disabled:opacity-50"
            style={{ fontFamily: 'inherit' }}
          />
          <button
            onClick={handleChatSend}
            disabled={chatLoading || !chatInput.trim()}
            className="px-3 py-1.5 rounded-sm text-xs font-bold transition-opacity hover:opacity-80 disabled:opacity-40"
            style={{ background: GOLD, color: '#09090b', fontFamily: 'inherit' }}
          >
            {chatLoading ? '...' : 'SEND'}
          </button>
        </div>

        <div className="text-zinc-600" style={{ fontSize: 10 }}>
          Claude sees this post + your voice guide automatically
        </div>
      </div>
    </div>
  )
}
