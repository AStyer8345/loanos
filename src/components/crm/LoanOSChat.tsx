'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent } from 'react'
import { useOutreachChat, type SelectedContact } from '@/components/outreach/OutreachChatContext'
import { parseCommand, CommandType, type ExtractedContact } from '@/lib/chat-command-parser'
import { bulkMailtoLink, imessageLink } from '@/lib/native-app-links'
import QuickAddConfirmation from '@/components/outreach/QuickAddConfirmation'
import BulkActionPreview from '@/components/outreach/BulkActionPreview'

const ACCENT = '#C9A84C'
const BG = '#0f0f0f'
const SURFACE = '#1a1a1a'
const BORDER = '#2a2a2a'
const FONT = '"IBM Plex Mono", "Courier New", monospace'

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  quickAdd?: { extracted: ExtractedContact; duplicate?: { first_name: string; last_name: string; email: string; phone: string } | null }
  bulkPreview?: { actionType: 'email' | 'text' | 'admin'; generatedContent?: string; adminAction?: string; adminValue?: string }
}

type Attachment = {
  uid: string
  type: 'image' | 'pdf'
  mimeType: string
  name: string
  data: string // raw base64, no data URI prefix
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1 MB
const MAX_FILES = 3
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const RECORD_QUICK_ACTIONS: Record<string, string[]> = {
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

const GENERAL_QUICK_ACTIONS = [
  { label: 'Add contact', prompt: 'Add ' },
  { label: 'Draft email', prompt: 'Draft an email to ' },
]

const SELECTED_QUICK_ACTIONS = (n: number) => [
  { label: `Email ${n}`, prompt: `Email the selected ${n} contacts about ` },
  { label: `Text ${n}`, prompt: `Text the selected ${n} contacts about ` },
  { label: 'Move stage', prompt: 'Move selected contacts to stage ' },
  { label: 'Change type', prompt: 'Change selected contacts type to ' },
]

export default function LoanOSChat() {
  const { selectedContacts, clearSelected, activeRecord, isOpen, setIsOpen } = useOutreachChat()

  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [historyLoaded, setHistoryLoaded] = useState<string | null>(null)

  const [isExpanded, setIsExpanded] = useState(false)

  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachError, setAttachError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingFileCountRef = useRef(0)

  const [isListening, setIsListening] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Detect SpeechRecognition support once on mount
  const [speechSupported, setSpeechSupported] = useState(false)
  useEffect(() => {
    setSpeechSupported(
      typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    )
  }, [])

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasSelected = selectedContacts.length > 0

  // Load session history when switching to a record context
  const loadHistory = useCallback(async (recordId: string, recordType: string) => {
    try {
      const res = await fetch(`/api/chat?recordId=${encodeURIComponent(recordId)}&recordType=${encodeURIComponent(recordType)}`)
      const data = await res.json()
      if (data.messages?.length) {
        setMessages(data.messages.map((m: { role: string; content: string }) => ({ ...m, id: uid() })))
        setSessionId(data.sessionId)
      } else {
        setMessages([])
        setSessionId(null)
      }
    } catch {
      setMessages([])
      setSessionId(null)
    }
  }, [])

  // When activeRecord changes, reset chat and load history for that record
  useEffect(() => {
    const key = activeRecord ? `${activeRecord.type}:${activeRecord.id}` : null
    if (key === historyLoaded) return
    setHistoryLoaded(key)
    setMessages([])
    setSessionId(null)
    if (activeRecord && isOpen) {
      loadHistory(activeRecord.id, activeRecord.type)
    }
  }, [activeRecord, isOpen, historyLoaded, loadHistory])

  // Load history when chat opens on a record
  useEffect(() => {
    if (isOpen && activeRecord) {
      const key = `${activeRecord.type}:${activeRecord.id}`
      if (historyLoaded !== key) {
        setHistoryLoaded(key)
        loadHistory(activeRecord.id, activeRecord.type)
      }
    }
  }, [isOpen, activeRecord, historyLoaded, loadHistory])

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      recognitionRef.current?.stop()
      setIsListening(false)
      setInterimTranscript('')
    }
    return () => {
      recognitionRef.current?.stop()
    }
  }, [isOpen])

  // Collapse expanded mode on Esc
  useEffect(() => {
    if (!isExpanded) return
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') setIsExpanded(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isExpanded])

  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { ...msg, id: uid() }])
  }, [])

  const addAssistant = useCallback((content: string, extra?: Partial<Message>) => {
    setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content, ...extra }])
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setAttachError(null)
    const files = Array.from(e.target.files ?? [])
    // Check total including in-flight reads not yet committed to state
    if (attachments.length + pendingFileCountRef.current + files.length > MAX_FILES) {
      setAttachError(`Max ${MAX_FILES} files per message.`)
      e.target.value = ''
      return
    }
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setAttachError(`${file.name}: unsupported type. Use JPEG, PNG, WebP, or PDF.`)
        e.target.value = ''
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setAttachError(`${file.name} is too large (max 1 MB).`)
        e.target.value = ''
        return
      }
      // Only increment AFTER validation passes — inside the loop
      pendingFileCountRef.current += 1
      const reader = new FileReader()
      reader.onerror = () => {
        pendingFileCountRef.current -= 1
        setAttachError(`Could not read ${file.name} — please try again.`)
      }
      reader.onload = () => {
        pendingFileCountRef.current -= 1
        const result = reader.result as string
        // Strip the data URI prefix: "data:image/jpeg;base64," → raw base64
        const base64 = result.split(',')[1]
        setAttachments((prev) => [
          ...prev,
          {
            uid: `${file.name}-${Date.now()}`,
            type: file.type === 'application/pdf' ? 'pdf' : 'image',
            mimeType: file.type,
            name: file.name,
            data: base64,
          },
        ])
      }
      reader.readAsDataURL(file)
    }
    e.target.value = '' // reset so same file can be re-selected
  }

  function removeAttachment(uid: string) {
    setAttachments((prev) => prev.filter((a) => a.uid !== uid))
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter(
      (item) => item.kind === 'file' && ACCEPTED_TYPES.includes(item.type)
    )
    if (imageItems.length === 0) return // let normal text paste proceed

    e.preventDefault()
    setAttachError(null)

    for (const item of imageItems) {
      const file = item.getAsFile()
      if (!file) continue

      if (attachments.length + pendingFileCountRef.current + 1 > MAX_FILES) {
        setAttachError(`Max ${MAX_FILES} files per message.`)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setAttachError('Pasted image is too large (max 1 MB).')
        return
      }

      pendingFileCountRef.current += 1
      const reader = new FileReader()
      reader.onerror = () => {
        pendingFileCountRef.current -= 1
        setAttachError('Could not read pasted image — please try again.')
      }
      reader.onload = () => {
        pendingFileCountRef.current -= 1
        const result = reader.result as string
        const base64 = result.split(',')[1]
        const ext = file.type.split('/')[1] ?? 'png'
        setAttachments((prev) => [
          ...prev,
          {
            uid: `paste-${Date.now()}`,
            type: 'image',
            mimeType: file.type,
            name: `screenshot.${ext}`,
            data: base64,
          },
        ])
      }
      reader.readAsDataURL(file)
    }
  }

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }

    const SpeechRecognitionAPI =
      (window as Window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition ??
      (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition
    if (!SpeechRecognitionAPI) return

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      if (final) setInput((prev) => (prev ? prev + ' ' + final.trim() : final.trim()))
      setInterimTranscript(interim)
    }

    recognition.onend = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognition.onerror = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  // ── Core Claude call ────────────────────────────────────────────────────
  async function callClaude(
    userMessage: string,
    generateType?: 'email' | 'text',
    messageAttachments?: Attachment[]
  ): Promise<{ text: string; sessionId?: string }> {
    const chatMessages = [
      ...messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: userMessage },
    ]

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: chatMessages,
        recordId: activeRecord?.id,
        recordType: activeRecord?.type,
        sessionId,
        selectedContacts: hasSelected ? selectedContacts : undefined,
        generateType,
        attachments: messageAttachments?.length ? messageAttachments : undefined,
      }),
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Chat request failed')
    return { text: data.message.content, sessionId: data.sessionId }
  }

  // ── Quick Add ───────────────────────────────────────────────────────────
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
      setMessages((prev) => prev.filter((m) => !m.quickAdd))
      addAssistant(res.ok ? data.message : (data.error || 'Failed to add contact.'))
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

  // ── Bulk Email ──────────────────────────────────────────────────────────
  async function handleBulkEmail(text: string) {
    setIsLoading(true)
    addAssistant('', { bulkPreview: { actionType: 'email' } })
    try {
      const { text: content } = await callClaude(text, 'email')
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
    window.open(bulkMailtoLink(emails, '', content), '_blank')
    setMessages((prev) => prev.filter((m) => !m.bulkPreview))
    addAssistant(`Opened email client for ${emails.length} recipient${emails.length !== 1 ? 's' : ''}.`)
    clearSelected()
  }

  // ── Bulk Text ───────────────────────────────────────────────────────────
  async function handleBulkText(text: string) {
    setIsLoading(true)
    addAssistant('', { bulkPreview: { actionType: 'text' } })
    try {
      const { text: content } = await callClaude(text, 'text')
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
    window.open(imessageLink(phones[0], content), '_blank')
    setMessages((prev) => prev.filter((m) => !m.bulkPreview))
    const note = phones.length > 1 ? ` (iMessage opened for first contact — send individually for the rest)` : ''
    addAssistant(`Opened Messages for ${contacts[0].first_name || 'contact'}.${note}`)
    clearSelected()
  }

  // ── Bulk Admin ──────────────────────────────────────────────────────────
  function handleBulkAdmin(text: string, contacts: SelectedContact[]) {
    const lower = text.toLowerCase()
    let adminAction: 'update_stage' | 'update_type' | 'delete' = 'update_stage'
    let adminValue = ''

    if (/delet/i.test(lower)) {
      adminAction = 'delete'
    } else if (/type\s+(to\s+)?/i.test(lower)) {
      adminAction = 'update_type'
      const match = lower.match(/type\s+(?:to\s+)?["']?([^"']+)["']?/i)
      adminValue = match?.[1]?.trim() || ''
    } else {
      const match = lower.match(/(?:stage|move|to)\s+["']?([^"']+)["']?$/i)
      adminValue = match?.[1]?.trim() || ''
    }

    if (!adminValue && adminAction !== 'delete') {
      addAssistant('Could not determine the target value. Try: "Move selected to Pre-Approved" or "Change type to realtor"')
      return
    }

    addAssistant(
      `Confirm: ${adminAction === 'delete' ? 'Delete' : `Set ${adminAction === 'update_stage' ? 'stage' : 'type'} to "${adminValue}" for`} ${contacts.length} contact${contacts.length !== 1 ? 's' : ''}?`,
      { bulkPreview: { actionType: 'admin', adminAction, adminValue } }
    )
  }

  async function confirmBulkAdmin(contacts: SelectedContact[], action: string, value: string) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/contacts/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: contacts.map((c) => c.id), action, value: value || undefined }),
      })
      const data = await res.json()
      setMessages((prev) => prev.filter((m) => !m.bulkPreview))
      addAssistant(res.ok ? data.message : (data.error || 'Bulk action failed.'))
      if (res.ok) clearSelected()
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

  // ── Main submit ─────────────────────────────────────────────────────────
  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if ((!text && attachments.length === 0) || isLoading) return

    addMessage({ role: 'user', content: text })
    setInput('')

    // Clear attachment state on any submit
    setAttachments([])
    setAttachError(null)
    pendingFileCountRef.current = 0

    const parsed = parseCommand(text, hasSelected)

    switch (parsed.type) {
      case CommandType.QUICK_ADD:
        await handleQuickAdd(text)
        break
      case CommandType.BULK_EMAIL:
        if (!hasSelected) { addAssistant('Select contacts first, then ask me to email them.'); break }
        await handleBulkEmail(text)
        break
      case CommandType.BULK_TEXT:
        if (!hasSelected) { addAssistant('Select contacts first, then ask me to text them.'); break }
        await handleBulkText(text)
        break
      case CommandType.BULK_ADMIN:
        if (!hasSelected) { addAssistant('Select contacts first, then tell me what to do with them.'); break }
        handleBulkAdmin(text, selectedContacts)
        break
      case CommandType.GENERAL_CHAT:
      default: {
        const pendingAttachments = attachments
        setIsLoading(true)
        try {
          const { text: reply, sessionId: newSessionId } = await callClaude(text, undefined, pendingAttachments)
          addAssistant(reply)
          if (newSessionId) setSessionId(newSessionId)
        } catch {
          addAssistant('Something went wrong. Try again.')
        } finally {
          setIsLoading(false)
        }
        break
      }
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ── Quick action chips ──────────────────────────────────────────────────
  const quickActionChips = activeRecord
    ? (RECORD_QUICK_ACTIONS[activeRecord.type] ?? []).map((label) => ({ label, prompt: label }))
    : hasSelected
      ? SELECTED_QUICK_ACTIONS(selectedContacts.length)
      : GENERAL_QUICK_ACTIONS

  // ── Header label ────────────────────────────────────────────────────────
  const headerTitle = activeRecord
    ? activeRecord.name
    : hasSelected
      ? `${selectedContacts.length} contact${selectedContacts.length !== 1 ? 's' : ''} selected`
      : 'LoanOS AI'

  const headerSub = activeRecord
    ? activeRecord.type
    : hasSelected
      ? null
      : 'Ask anything'

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
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
          fontFamily: FONT,
          fontSize: hasSelected ? 14 : 20,
          fontWeight: 700,
          color: '#000',
          boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
          transition: 'transform 0.15s ease',
          transform: isOpen ? 'rotate(45deg)' : 'none',
        }}
        onMouseEnter={(e) => { if (!isOpen) (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)' }}
        onMouseLeave={(e) => { if (!isOpen) (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
      >
        {hasSelected ? selectedContacts.length : activeRecord ? '◈' : '✉'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div
          style={
            isExpanded
              ? {
                  position: 'fixed',
                  inset: 0,
                  zIndex: 9000,
                  background: BG,
                  border: 'none',
                  borderRadius: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: FONT,
                  fontSize: 13,
                  color: '#e0e0e0',
                  overflow: 'hidden',
                }
              : {
                  position: 'fixed',
                  bottom: 88,
                  right: 24,
                  zIndex: 9000,
                  width: 400,
                  height: 560,
                  background: BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: FONT,
                  fontSize: 13,
                  color: '#e0e0e0',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
                  overflow: 'hidden',
                }
          }
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#0a0a0a',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, color: ACCENT, fontSize: 13 }}>{headerTitle}</div>
              {headerSub && (
                <div style={{ fontSize: 11, color: '#666', marginTop: 2, textTransform: 'capitalize' }}>
                  {headerSub}
                </div>
              )}
              {hasSelected && !activeRecord && (
                <button
                  onClick={clearSelected}
                  style={{
                    marginTop: 2,
                    background: 'none',
                    border: 'none',
                    color: ACCENT,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontFamily: FONT,
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  clear selection
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {messages.length > 0 && (
                <button
                  onClick={() => { setMessages([]); setSessionId(null) }}
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
                onClick={() => setIsExpanded((v) => !v)}
                title={isExpanded ? 'Collapse' : 'Expand to full screen'}
                style={{
                  background: 'none',
                  border: `1px solid ${BORDER}`,
                  borderRadius: 6,
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: 13,
                  padding: '3px 7px',
                  fontFamily: FONT,
                }}
              >
                {isExpanded ? '⤡' : '⤢'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {messages.length === 0 && !isLoading && (
              <div style={{ marginTop: 16 }}>
                <div style={{ color: '#555', fontSize: 11, textAlign: 'center', marginBottom: 12 }}>
                  {activeRecord
                    ? `Ask anything about this ${activeRecord.type}`
                    : hasSelected
                      ? `${selectedContacts.length} contacts selected. Email, text, or manage them.`
                      : 'Add contacts, draft messages, or ask anything.'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {quickActionChips.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => { setInput(a.prompt); inputRef.current?.focus() }}
                      style={{
                        background: SURFACE,
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
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = ACCENT; (e.currentTarget as HTMLElement).style.color = ACCENT }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = BORDER; (e.currentTarget as HTMLElement).style.color = '#888' }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => {
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
                        if (msg.bulkPreview!.actionType === 'email') confirmBulkEmail(msg.bulkPreview!.generatedContent || msg.content, selectedContacts)
                        else if (msg.bulkPreview!.actionType === 'text') confirmBulkText(msg.bulkPreview!.generatedContent || msg.content, selectedContacts)
                        else if (msg.bulkPreview!.actionType === 'admin') confirmBulkAdmin(selectedContacts, msg.bulkPreview!.adminAction!, msg.bulkPreview!.adminValue!)
                      }}
                      onCancel={cancelBulkAction}
                    />
                  </div>
                )
              }
              const isUser = msg.role === 'user'
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: isUser ? ACCENT : SURFACE,
                    color: isUser ? '#000' : '#e0e0e0',
                    border: isUser ? 'none' : `1px solid ${BORDER}`,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                    fontSize: 12,
                  }}
                >
                  {msg.content}
                </div>
              )
            })}

            {isLoading && !messages.some((m) => m.bulkPreview) && (
              <div style={{ alignSelf: 'flex-start', padding: '8px 12px', borderRadius: 8, background: SURFACE, border: `1px solid ${BORDER}`, color: '#888', fontSize: 12 }}>
                Thinking...
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{ padding: '8px 12px 12px', borderTop: `1px solid ${BORDER}` }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            {/* Attachment chips */}
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {attachments.map((att) => (
                  <div
                    key={att.uid}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: SURFACE,
                      border: `1px solid ${BORDER}`,
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11,
                      color: ACCENT,
                    }}
                  >
                    {att.type === 'pdf' ? '📄' : '🖼'}
                    <span>{att.name.length > 20 ? att.name.slice(0, 17) + '…' : att.name}</span>
                    <button
                      onClick={() => removeAttachment(att.uid)}
                      style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 12, padding: '0 0 0 2px', lineHeight: 1 }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Attachment error */}
            {attachError && (
              <div style={{ fontSize: 11, color: '#e05555', marginBottom: 6 }}>{attachError}</div>
            )}

            {/* Interim voice transcript */}
            {isListening && (
              <div style={{
                fontSize: 11,
                color: '#888',
                marginBottom: 6,
                padding: '4px 8px',
                background: SURFACE,
                borderRadius: 4,
                border: `1px solid ${BORDER}`,
              }}>
                🔴 {interimTranscript ? `"${interimTranscript}"` : 'Listening…'}
              </div>
            )}

            {/* Input row */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              {/* Left: attach + mic stacked */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 6,
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    color: isLoading ? '#444' : '#888',
                    cursor: isLoading ? 'default' : 'pointer',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  📎
                </button>
                {speechSupported && (
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={toggleListening}
                    title={isListening ? 'Stop dictating' : 'Dictate'}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 6,
                      background: isListening ? '#2a1a00' : SURFACE,
                      border: `1px solid ${isListening ? ACCENT : BORDER}`,
                      color: isListening ? ACCENT : (isLoading ? '#444' : '#888'),
                      cursor: isLoading ? 'default' : 'pointer',
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: isListening ? 'pulse 1.2s ease-in-out infinite' : 'none',
                    }}
                  >
                    🎤
                  </button>
                )}
                {!speechSupported && <div style={{ width: 30, height: 30 }} />}
              </div>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={
                  activeRecord
                    ? `Ask about this ${activeRecord.type}…`
                    : hasSelected
                      ? 'Email, text, or manage contacts...'
                      : 'Add a contact or ask anything...'
                }
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#e0e0e0',
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

              {/* Send button */}
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                style={{
                  background: (input.trim() || attachments.length > 0) && !isLoading ? ACCENT : '#2a2a2a',
                  border: 'none',
                  borderRadius: 8,
                  color: (input.trim() || attachments.length > 0) && !isLoading ? '#000' : '#444',
                  cursor: (input.trim() || attachments.length > 0) && !isLoading ? 'pointer' : 'default',
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
            </form>
          </div>
        </div>
      )}
    </>
  )
}
