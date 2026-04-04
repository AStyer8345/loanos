'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react'
import { useOutreachChat, type SelectedContact } from './OutreachChatContext'
import { parseCommand, CommandType, type ExtractedContact } from '@/lib/chat-command-parser'
import { bulkMailtoLink, imessageLink } from '@/lib/native-app-links'
import QuickAddConfirmation from './QuickAddConfirmation'
import BulkActionPreview from './BulkActionPreview'

// ── Theme (matches LoanOSChat) ─────────────────────────────────────────────
const ACCENT = 'var(--accent)'
const BG = 'var(--bg)'
const SURFACE = 'var(--card)'
const BORDER = 'var(--border)'
const TEXT = 'var(--text)'
const MUTED_FG = 'var(--muted-foreground)'
const FONT = '"IBM Plex Mono", "Courier New", monospace'

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  quickAdd?: { extracted: ExtractedContact; duplicate?: { first_name: string; last_name: string; email: string; phone: string } | null }
  bulkPreview?: { actionType: 'email' | 'text' | 'admin'; generatedContent?: string; adminAction?: string; adminValue?: string }
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// ── Quick Actions ───────────────────────────────────────────────────────────
const GENERAL_ACTIONS = [
  { label: 'Add contact', prompt: 'Add ' },
  { label: 'Draft email', prompt: 'Draft an email to ' },
]

const SELECTED_ACTIONS = (n: number) => [
  { label: `Email ${n}`, prompt: `Email the selected ${n} contacts about ` },
  { label: `Text ${n}`, prompt: `Text the selected ${n} contacts about ` },
  { label: 'Move stage', prompt: 'Move selected contacts to stage ' },
  { label: 'Change type', prompt: 'Change selected contacts type to ' },
]

export default function OutreachChat() {
  const { selectedContacts, clearSelected, isOpen, setIsOpen } = useOutreachChat()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const hasSelected = selectedContacts.length > 0

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // ── Helpers ─────────────────────────────────────────────────────────────
  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: uid() }])
  }, [])

  const addAssistant = useCallback(
    (content: string, extra?: Partial<Message>) => {
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content, ...extra }])
    },
    []
  )

  // ── Chat with Claude ────────────────────────────────────────────────────
  async function chatWithClaude(
    userMessage: string,
    generateType?: 'email' | 'text'
  ): Promise<string> {
    const chatMessages = [
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage },
    ]

    const res = await fetch('/api/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatMessages,
        selectedContacts: hasSelected ? selectedContacts : undefined,
        generateType,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Chat request failed')
    return data.message
  }

  // ── Quick Add Flow ──────────────────────────────────────────────────────
  async function handleQuickAdd(text: string) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/contacts/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: text }),
      })
      const data = await res.json()

      if (!res.ok) {
        addAssistant(data.error || 'Failed to parse contact info.')
        return
      }

      if (data.needsConfirmation) {
        addAssistant(data.message, {
          quickAdd: { extracted: data.extracted, duplicate: data.duplicate },
        })
      }
    } catch {
      addAssistant('Something went wrong parsing the contact.')
    } finally {
      setIsLoading(false)
    }
  }

  async function confirmQuickAdd(contact: ExtractedContact) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/contacts/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, confirmed: true }),
      })
      const data = await res.json()

      // Remove the confirmation message
      setMessages((prev) => prev.filter((m) => !m.quickAdd))

      if (!res.ok) {
        addAssistant(data.error || 'Failed to add contact.')
      } else {
        addAssistant(data.message)
      }
    } catch {
      addAssistant('Something went wrong adding the contact.')
    } finally {
      setIsLoading(false)
    }
  }

  function cancelQuickAdd() {
    setMessages((prev) => prev.filter((m) => !m.quickAdd))
    addAssistant('Contact add cancelled.')
  }

  // ── Bulk Email Flow ─────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleBulkEmail(text: string, _contacts: SelectedContact[]) {
    setIsLoading(true)
    addAssistant('', { bulkPreview: { actionType: 'email' } })

    try {
      const content = await chatWithClaude(text, 'email')
      // Update the preview message with generated content
      setMessages((prev) =>
        prev.map((m) =>
          m.bulkPreview?.actionType === 'email' && !m.bulkPreview.generatedContent
            ? { ...m, content, bulkPreview: { ...m.bulkPreview, generatedContent: content } }
            : m
        )
      )
    } catch {
      setMessages((prev) => prev.filter((m) => !m.bulkPreview))
      addAssistant('Failed to generate email content.')
    } finally {
      setIsLoading(false)
    }
  }

  function confirmBulkEmail(content: string, contacts: SelectedContact[]) {
    const emails = contacts.map((c) => c.email).filter(Boolean) as string[]
    if (emails.length === 0) {
      setMessages((prev) => prev.filter((m) => !m.bulkPreview))
      addAssistant('None of the selected contacts have email addresses.')
      return
    }

    const link = bulkMailtoLink(emails, '', content)
    window.open(link, '_blank')

    setMessages((prev) => prev.filter((m) => !m.bulkPreview))
    addAssistant(`Opened email client for ${emails.length} recipient${emails.length !== 1 ? 's' : ''}.`)
    clearSelected()
  }

  // ── Bulk Text Flow ──────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleBulkText(text: string, _contacts: SelectedContact[]) {
    setIsLoading(true)
    addAssistant('', { bulkPreview: { actionType: 'text' } })

    try {
      const content = await chatWithClaude(text, 'text')
      setMessages((prev) =>
        prev.map((m) =>
          m.bulkPreview?.actionType === 'text' && !m.bulkPreview.generatedContent
            ? { ...m, content, bulkPreview: { ...m.bulkPreview, generatedContent: content } }
            : m
        )
      )
    } catch {
      setMessages((prev) => prev.filter((m) => !m.bulkPreview))
      addAssistant('Failed to generate text message.')
    } finally {
      setIsLoading(false)
    }
  }

  function confirmBulkText(content: string, contacts: SelectedContact[]) {
    const phones = contacts.map((c) => c.phone).filter(Boolean) as string[]
    if (phones.length === 0) {
      setMessages((prev) => prev.filter((m) => !m.bulkPreview))
      addAssistant('None of the selected contacts have phone numbers.')
      return
    }

    // iMessage doesn't support bulk — open for first contact
    const link = imessageLink(phones[0], content)
    window.open(link, '_blank')

    setMessages((prev) => prev.filter((m) => !m.bulkPreview))
    const note = phones.length > 1 ? ` (iMessage opened for first contact — send individually for the rest)` : ''
    addAssistant(`Opened Messages for ${contacts[0].first_name || 'contact'}.${note}`)
    clearSelected()
  }

  // ── Bulk Admin Flow ─────────────────────────────────────────────────────
  function handleBulkAdmin(text: string, contacts: SelectedContact[]) {
    const lower = text.toLowerCase()

    // Detect action + value
    let adminAction: 'update_stage' | 'update_type' | 'delete' = 'update_stage'
    let adminValue = ''

    if (/delet/i.test(lower)) {
      adminAction = 'delete'
    } else if (/type\s+(to\s+)?/i.test(lower)) {
      adminAction = 'update_type'
      const match = lower.match(/type\s+(?:to\s+)?["']?([^"']+)["']?/i)
      adminValue = match?.[1]?.trim() || ''
    } else {
      // Default: stage update
      const match = lower.match(/(?:stage|move|to)\s+["']?([^"']+)["']?$/i)
      adminValue = match?.[1]?.trim() || ''
    }

    if (!adminValue && adminAction !== 'delete') {
      addAssistant('Could not determine the target value. Try: "Move selected to Pre-Approved" or "Change type to realtor"')
      return
    }

    addAssistant(`Confirm: ${adminAction === 'delete' ? 'Delete' : `Set ${adminAction === 'update_stage' ? 'stage' : 'type'} to "${adminValue}" for`} ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}?`, {
      bulkPreview: { actionType: 'admin', adminAction, adminValue },
    })
  }

  async function confirmBulkAdmin(
    contacts: SelectedContact[],
    action: string,
    value: string
  ) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/contacts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactIds: contacts.map((c) => c.id),
          action,
          value: value || undefined,
        }),
      })
      const data = await res.json()

      setMessages((prev) => prev.filter((m) => !m.bulkPreview))

      if (!res.ok) {
        addAssistant(data.error || 'Bulk action failed.')
      } else {
        addAssistant(data.message)
        clearSelected()
      }
    } catch {
      setMessages((prev) => prev.filter((m) => !m.bulkPreview))
      addAssistant('Something went wrong with the bulk action.')
    } finally {
      setIsLoading(false)
    }
  }

  function cancelBulkAction() {
    setMessages((prev) => prev.filter((m) => !m.bulkPreview))
    addAssistant('Action cancelled.')
  }

  // ── Main Submit Handler ─────────────────────────────────────────────────
  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    addMessage({ role: 'user', content: text })
    setInput('')

    const parsed = parseCommand(text, hasSelected)

    switch (parsed.type) {
      case CommandType.QUICK_ADD:
        await handleQuickAdd(text)
        break

      case CommandType.BULK_EMAIL:
        if (!hasSelected) {
          addAssistant('Select contacts first, then ask me to email them.')
          break
        }
        await handleBulkEmail(text, selectedContacts)
        break

      case CommandType.BULK_TEXT:
        if (!hasSelected) {
          addAssistant('Select contacts first, then ask me to text them.')
          break
        }
        await handleBulkText(text, selectedContacts)
        break

      case CommandType.BULK_ADMIN:
        if (!hasSelected) {
          addAssistant('Select contacts first, then tell me what to do with them.')
          break
        }
        handleBulkAdmin(text, selectedContacts)
        break

      case CommandType.GENERAL_CHAT:
      default:
        setIsLoading(true)
        try {
          const reply = await chatWithClaude(text)
          addAssistant(reply)
        } catch {
          addAssistant('Something went wrong. Try again.')
        } finally {
          setIsLoading(false)
        }
        break
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleQuickAction(prompt: string) {
    setInput(prompt)
    inputRef.current?.focus()
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const actions = hasSelected ? SELECTED_ACTIONS(selectedContacts.length) : GENERAL_ACTIONS

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 9999,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: ACCENT,
          color: 'var(--primary-foreground)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          fontSize: 20,
          fontWeight: 700,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          transition: 'transform 0.15s',
          transform: isOpen ? 'rotate(45deg)' : 'none',
        }}
        title="Outreach Assistant"
      >
        {hasSelected ? (
          <span style={{ fontSize: 14, fontWeight: 700 }}>{selectedContacts.length}</span>
        ) : (
          '✉'
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 88,
            left: 24,
            zIndex: 9998,
            width: 400,
            height: 560,
            background: BG,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: FONT,
            fontSize: 13,
            color: TEXT,
            boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: ACCENT, fontSize: 14 }}>Outreach</div>
              {hasSelected && (
                <div style={{ fontSize: 11, color: MUTED_FG, marginTop: 2 }}>
                  {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                  <button
                    onClick={clearSelected}
                    style={{
                      marginLeft: 8,
                      background: 'none',
                      border: 'none',
                      color: ACCENT,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontFamily: FONT,
                      textDecoration: 'underline',
                    }}
                  >
                    clear
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: MUTED_FG,
                cursor: 'pointer',
                fontSize: 18,
                fontFamily: FONT,
              }}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {messages.length === 0 && (
              <div style={{ color: MUTED_FG, fontSize: 12, textAlign: 'center', marginTop: 40 }}>
                {hasSelected
                  ? `${selectedContacts.length} contacts selected. Email, text, or manage them.`
                  : 'Add contacts, draft messages, or ask anything.'}
              </div>
            )}

            {messages.map((msg) => {
              // Quick Add Confirmation
              if (msg.quickAdd) {
                return (
                  <div key={msg.id}>
                    <QuickAddConfirmation
                      extracted={msg.quickAdd.extracted}
                      duplicate={msg.quickAdd.duplicate}
                      onConfirm={confirmQuickAdd}
                      onCancel={cancelQuickAdd}
                    />
                  </div>
                )
              }

              // Bulk Action Preview
              if (msg.bulkPreview) {
                return (
                  <div key={msg.id}>
                    <BulkActionPreview
                      contacts={selectedContacts}
                      actionType={msg.bulkPreview.actionType}
                      generatedContent={msg.bulkPreview.generatedContent}
                      adminAction={msg.bulkPreview.adminAction}
                      adminValue={msg.bulkPreview.adminValue}
                      isLoading={isLoading && !msg.bulkPreview.generatedContent && msg.bulkPreview.actionType !== 'admin'}
                      onConfirm={() => {
                        if (msg.bulkPreview!.actionType === 'email') {
                          confirmBulkEmail(msg.bulkPreview!.generatedContent || msg.content, selectedContacts)
                        } else if (msg.bulkPreview!.actionType === 'text') {
                          confirmBulkText(msg.bulkPreview!.generatedContent || msg.content, selectedContacts)
                        } else if (msg.bulkPreview!.actionType === 'admin') {
                          confirmBulkAdmin(selectedContacts, msg.bulkPreview!.adminAction!, msg.bulkPreview!.adminValue!)
                        }
                      }}
                      onCancel={cancelBulkAction}
                    />
                  </div>
                )
              }

              // Regular messages
              const isUser = msg.role === 'user'
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: isUser ? ACCENT : SURFACE,
                    color: isUser ? 'var(--primary-foreground)' : TEXT,
                    border: isUser ? 'none' : `1px solid ${BORDER}`,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.55,
                    fontSize: 13,
                    boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  {msg.content}
                </div>
              )
            })}

            {isLoading && !messages.some((m) => m.bulkPreview) && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  color: MUTED_FG,
                  fontSize: 12,
                }}
              >
                <span style={{ animation: 'pulse 1.5s infinite' }}>Thinking...</span>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div
            style={{
              padding: '8px 12px',
              borderTop: `1px solid ${BORDER}`,
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={() => handleQuickAction(a.prompt)}
                style={{
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  color: ACCENT,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: FONT,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = SURFACE)}
              >
                {a.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '8px 12px 12px',
              borderTop: `1px solid ${BORDER}`,
              display: 'flex',
              gap: 8,
              alignItems: 'flex-end',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={hasSelected ? 'Email, text, or manage contacts...' : 'Add a contact or ask anything...'}
              rows={1}
              style={{
                flex: 1,
                resize: 'none',
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: 8,
                padding: '8px 10px',
                color: TEXT,
                fontFamily: FONT,
                fontSize: 12,
                outline: 'none',
                maxHeight: 80,
                lineHeight: 1.4,
              }}
              onInput={(e) => {
                const el = e.currentTarget
                el.style.height = 'auto'
                el.style.height = Math.min(el.scrollHeight, 80) + 'px'
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                background: ACCENT,
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                color: 'var(--primary-foreground)',
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 700,
                cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                opacity: input.trim() && !isLoading ? 1 : 0.4,
                transition: 'opacity 0.15s',
              }}
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  )
}
