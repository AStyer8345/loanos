# Chat Attachments, Voice & Expand Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add file/image attachment, voice dictation, and full-screen expand to the unified `LoanOSChat` floating bot.

**Architecture:** Three independent capabilities added to two existing files — the API route gains a `buildUserContent` helper that converts attachments to Anthropic multimodal blocks, and the React component gains new state + UI for each capability. No new routes, no new runtime dependencies, no DB changes.

**Tech Stack:** TypeScript, React 18, Next.js 14 App Router, Anthropic SDK (`@anthropic-ai/sdk`), Web Speech API (browser-native), `@types/dom-speech-recognition` (devDep, types only)

---

## File Map

| File | What changes |
|------|-------------|
| `package.json` | Add `@types/dom-speech-recognition` to `devDependencies` |
| `src/app/api/chat/route.ts` | Add `Attachment` type, `buildUserContent` helper, wire into POST handler |
| `src/components/crm/LoanOSChat.tsx` | Attachment state + chips + file input; expand state + Esc; voice state + mic button |

---

## Task 1: Install the SpeechRecognition type package

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the devDependency**

```bash
cd /Users/adamstyer/Documents/loanos-clone
npm install --save-dev @types/dom-speech-recognition
```

Expected output: `added 1 package` (or similar — no errors)

- [ ] **Step 2: Verify it resolved**

```bash
cat node_modules/@types/dom-speech-recognition/index.d.ts | head -5
```

Expected: Shows TypeScript type definitions starting with `interface SpeechRecognition`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @types/dom-speech-recognition devDependency"
```

---

## Task 2: Server — `buildUserContent` helper and attachment wiring

**Files:**
- Modify: `src/app/api/chat/route.ts` (lines 55–60 for type, lines 260–280 for wiring)

The current `POST` handler normalises messages like this (around line 260):
```ts
const apiMessages = messages.map((m: { role: string; content: string }) => ({
  role: m.role as 'user' | 'assistant',
  content: m.content,
}))
```
We need to: (a) add the `Attachment` type, (b) add `buildUserContent`, (c) type `apiMessages` as `MessageParam[]` so its `content` field accepts both strings and `ContentBlockParam[]`, (d) replace the last user message's `content` with the multimodal block array when attachments are present, (e) read `attachments` from the request body.

- [ ] **Step 1: Add the `Attachment` type and `buildUserContent` helper**

In `src/app/api/chat/route.ts`, add immediately after the existing imports (after line 8, before `const NOTEBOOKLM_SERVICE_URL`):

```ts
import type { MessageParam, ContentBlockParam } from '@anthropic-ai/sdk/resources/messages'

type Attachment = {
  type: 'image' | 'pdf'
  mimeType: string
  name: string
  data: string // raw base64, no data URI prefix
}

function buildUserContent(text: string, attachments: Attachment[]): ContentBlockParam[] {
  const blocks: ContentBlockParam[] = []
  for (const att of attachments) {
    if (att.type === 'image') {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: att.mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
          data: att.data,
        },
      })
    } else {
      blocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf' as const,
          data: att.data,
        },
      })
    }
  }
  blocks.push({ type: 'text', text })
  return blocks
}
```

- [ ] **Step 2: Read `attachments` from the request body**

In the `POST` handler, find this line (around line 243):
```ts
const { messages, recordId, recordType, sessionId, selectedContacts, generateType } = await req.json()
```

Replace with:
```ts
const { messages, recordId, recordType, sessionId, selectedContacts, generateType, attachments } = await req.json()
```

- [ ] **Step 3: Type `apiMessages` correctly and replace last user message content when attachments present**

Replace the `apiMessages` map (around line 260) with a properly typed version:

```ts
const apiMessages: MessageParam[] = messages.map((m: { role: string; content: string }) => ({
  role: m.role as 'user' | 'assistant',
  content: m.content,
}))

// Replace last user message content with multimodal blocks when files are attached
if (attachments?.length) {
  const lastMsg = apiMessages[apiMessages.length - 1]
  if (lastMsg?.role === 'user' && typeof lastMsg.content === 'string') {
    lastMsg.content = buildUserContent(lastMsg.content, attachments)
  }
}
```

`MessageParam` (imported in Step 1) correctly types `content` as `string | ContentBlockParam[]`, so no unsafe cast is needed.

- [ ] **Step 4: Verify the route still type-checks**

```bash
cd /Users/adamstyer/Documents/loanos-clone
npx tsc --noEmit 2>&1 | head -20
```

Expected: No new errors related to `route.ts`. (Pre-existing errors are fine — don't fix unrelated issues.)

- [ ] **Step 5: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add multimodal attachment support to /api/chat route"
```

---

## Task 3: Client — Attachment state, file input, and chips UI

**Files:**
- Modify: `src/components/crm/LoanOSChat.tsx`

This task reworks the input area layout and adds file selection. The current input form (around line 627) has a flat `display: flex` row with just a `<textarea>` and send button. We're restructuring to:
1. A wrapper `<div>` containing optional chips, optional interim voice row, and the input row
2. The input row: side-stacked buttons left, textarea flex-grow, send button right

- [ ] **Step 1: Add the `Attachment` type and new state**

After the existing `Message` type (around line 16), add:

```ts
type Attachment = {
  type: 'image' | 'pdf'
  mimeType: string
  name: string
  data: string // raw base64, no data URI prefix
}
```

Inside the component function, after the existing state declarations (after line 62), add:

```ts
const [attachments, setAttachments] = useState<Attachment[]>([])
const [attachError, setAttachError] = useState<string | null>(null)
const fileInputRef = useRef<HTMLInputElement>(null)
```

- [ ] **Step 2: Add the file selection handler**

After the `addAssistant` callback (around line 129), add:

```ts
const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1 MB
const MAX_FILES = 3
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
  setAttachError(null)
  const files = Array.from(e.target.files ?? [])
  if (attachments.length + files.length > MAX_FILES) {
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
    const reader = new FileReader()
    reader.onerror = () => setAttachError(`Could not read ${file.name} — please try again.`)
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URI prefix: "data:image/jpeg;base64," → raw base64
      const base64 = result.split(',')[1]
      setAttachments((prev) => [
        ...prev,
        {
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

function removeAttachment(index: number) {
  setAttachments((prev) => prev.filter((_, i) => i !== index))
}
```

- [ ] **Step 3: Pass attachments to `callClaude` and clear after send**

Update `callClaude` signature to accept attachments (the existing `handleBulkEmail` and `handleBulkText` callers are unaffected — the parameter is optional):

```ts
async function callClaude(
  userMessage: string,
  generateType?: 'email' | 'text',
  messageAttachments?: Attachment[]
): Promise<{ text: string; sessionId?: string }> {
```

In the `fetch` body inside `callClaude`, add `attachments` to the JSON payload:

```ts
body: JSON.stringify({
  messages: chatMessages,
  recordId: activeRecord?.id,
  recordType: activeRecord?.type,
  sessionId,
  selectedContacts: hasSelected ? selectedContacts : undefined,
  generateType,
  attachments: messageAttachments?.length ? messageAttachments : undefined,
}),
```

Update the `handleSubmit` early-return guard to allow attachment-only sends (no text):

```ts
// Before: if (!text || isLoading) return
// After:
if ((!text && attachments.length === 0) || isLoading) return
```

In `handleSubmit`, update the `GENERAL_CHAT` branch to pass and clear attachments. Wrap in a block `{}` to allow `const` declarations inside the `switch` case:

```ts
case CommandType.GENERAL_CHAT:
default: {
  const pendingAttachments = attachments
  setAttachments([])  // clear chips immediately on send
  setAttachError(null)
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
```

- [ ] **Step 4: Replace the input form JSX with the new layout**

Replace the entire `{/* Input */}` form (from `<form` to `</form>`, lines 627–685) with:

```tsx
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
      {attachments.map((att, i) => (
        <div
          key={i}
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
            onClick={() => removeAttachment(i)}
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
      {/* Mic button rendered in Task 5 — placeholder div keeps layout stable */}
      <div style={{ width: 30, height: 30 }} />
    </div>

    {/* Textarea */}
    <textarea
      ref={inputRef}
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleKeyDown}
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
```

- [ ] **Step 5: Verify in browser**

With the dev server running (`npm run dev` in `/Users/adamstyer/Documents/loanos-clone`):
1. Open http://localhost:3000
2. Click the gold chat button — confirm panel opens
3. Click 📎 — confirm native file picker opens
4. Select a JPEG — confirm gold chip appears above input
5. Select the same file again — confirm it can be re-selected (input resets)
6. Click ✕ on the chip — confirm it disappears
7. Try to attach a 4th file — confirm error message appears

- [ ] **Step 6: Commit**

```bash
git add src/components/crm/LoanOSChat.tsx
git commit -m "feat: add file attachment UI to LoanOSChat (chips, file picker, validation)"
```

---

## Task 4: Client — Expand / full-screen mode

**Files:**
- Modify: `src/components/crm/LoanOSChat.tsx`

- [ ] **Step 1: Add `isExpanded` state**

After the existing state declarations (after `historyLoaded` state), add:

```ts
const [isExpanded, setIsExpanded] = useState(false)
```

- [ ] **Step 2: Add Esc key handler**

After the "Focus input when opened" `useEffect` (around line 121), add:

```ts
// Collapse expanded mode on Esc
useEffect(() => {
  if (!isExpanded) return
  function onKeyDown(e: globalThis.KeyboardEvent) {
    if (e.key === 'Escape') setIsExpanded(false)
  }
  window.addEventListener('keydown', onKeyDown)
  return () => window.removeEventListener('keydown', onKeyDown)
}, [isExpanded])
```

- [ ] **Step 3: Add the expand button to the header**

In the header's right-side button group (the `<div style={{ display: 'flex', gap: 8 }}>` around line 495), add the expand button **before** the close button:

```tsx
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
```

- [ ] **Step 4: Make the panel style conditional on `isExpanded`**

Find the chat panel's outer `<div` style (around line 439). Replace the static style object with a conditional one:

```tsx
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
```

Note: z-index changed from 9998 → 9000. The floating trigger button stays at 9999. Verify no existing modal in the app uses z-index > 9000 — if so, increase this value.

- [ ] **Step 5: Verify in browser**

1. Open chat panel
2. Click `⤢` — panel should fill entire screen, button changes to `⤡`
3. Press Esc — panel collapses back to corner
4. Click `⤢` again, click `⤡` — same collapse
5. All chat functionality (quick actions, message send) should work in expanded mode

- [ ] **Step 6: Commit**

```bash
git add src/components/crm/LoanOSChat.tsx
git commit -m "feat: add full-screen expand mode to LoanOSChat (⤢ button + Esc)"
```

---

## Task 5: Client — Voice dictation

**Files:**
- Modify: `src/components/crm/LoanOSChat.tsx`

- [ ] **Step 1: Add voice state and ref**

After the attachment state declarations (from Task 3), add:

```ts
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
```

- [ ] **Step 2: Stop recognition when chat panel closes and on unmount**

In the existing `useEffect` that focuses the input on open (around line 117), extend it to stop recognition when closed and add a cleanup return so recognition stops if the component unmounts while listening:

```ts
useEffect(() => {
  if (isOpen) {
    setTimeout(() => inputRef.current?.focus(), 100)
  } else {
    recognitionRef.current?.stop()
    setIsListening(false)
    setInterimTranscript('')
  }
  // Cleanup: stop recognition if component unmounts while chat is open
  return () => {
    recognitionRef.current?.stop()
  }
}, [isOpen])
```

- [ ] **Step 3: Add the `toggleListening` function**

After `handleFileSelect` / `removeAttachment` (from Task 3), add:

```ts
function toggleListening() {
  if (isListening) {
    recognitionRef.current?.stop()
    return
  }

  const SR = (window.SpeechRecognition ?? (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)!
  const recognition = new SR()
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
```

- [ ] **Step 4: Add interim transcript row and wire mic button**

In the input area (from Task 3), add the interim row **between** the attachment chips and the input form, and replace the placeholder `<div>` with the real mic button:

Interim row (insert after the `{attachError && ...}` block):

```tsx
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
```

Replace the placeholder `<div style={{ width: 30, height: 30 }} />` with the real mic button:

```tsx
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
```

Add the pulse keyframe animation by inserting a `<style>` tag once at the top of the component's return (before the floating button), if one doesn't already exist:

```tsx
<style>{`
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`}</style>
```

- [ ] **Step 5: Verify in browser (Chrome recommended — best SpeechRecognition support)**

1. Open chat panel
2. Mic button should be visible (hidden on Firefox)
3. Click mic → button glows gold and pulses, "Listening…" row appears
4. Speak a sentence → interim text appears in the row
5. Click mic again → recognition stops, transcript is appended to the textarea (not auto-sent)
6. Close chat panel → recognition stops automatically

- [ ] **Step 6: Final type-check**

```bash
cd /Users/adamstyer/Documents/loanos-clone
npx tsc --noEmit 2>&1 | grep -E "LoanOSChat|route\.ts"
```

Expected: No errors on those two files.

- [ ] **Step 7: Commit**

```bash
git add src/components/crm/LoanOSChat.tsx
git commit -m "feat: add voice dictation to LoanOSChat (tap-to-dictate, Web Speech API)"
```

---

## Task 6: End-to-end attachment test with the AI

- [ ] **Step 1: Test image attachment → Claude vision**

1. Find or create a small JPEG (any screenshot under 1 MB)
2. Open LoanOS chat on any page
3. Click 📎, select the JPEG → chip appears
4. Type "What's in this image?" and send
5. Expected: Claude describes the image content (proves multimodal flow works end-to-end)

- [ ] **Step 2: Test PDF attachment → Claude document reading**

1. Find a small PDF (any document under 1 MB — a one-page loan disclosure works great)
2. Attach it, type "Summarize this document" and send
3. Expected: Claude summarizes the PDF content

- [ ] **Step 3: Test attachment + knowledge base tool (combined)**

1. Attach a PDF of a loan scenario
2. Type "Based on this file, what Fannie Mae guidelines apply?"
3. Expected: Claude invokes `query_mortgage_knowledge_base`, then synthesizes the KB answer with the PDF content — two knowledge sources in one response

- [ ] **Step 4: Final commit if any polish was applied**

```bash
git add -p  # review any remaining changes
git commit -m "feat: chat attachments, voice dictation, and full-screen expand mode"
```
