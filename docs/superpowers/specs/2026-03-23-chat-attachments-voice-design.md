# LoanOS Chat — Attachments, Voice Input & Expand Mode
**Date:** 2026-03-23
**Status:** Approved (rev 2)

---

## Overview

Extend the unified `LoanOSChat` bot with three capabilities: file/image attachment, voice dictation, and a full-screen expand mode. The bot already reads structured record data (contact fields, loan fields, pipeline) from the system prompt — these features add richer input modalities without changing that data layer.

---

## 1. Input Layout

The chat input area gains two icon buttons stacked vertically to the **left** of the textarea. The send button stays bottom-right. Both buttons are **disabled** while `isLoading` is true.

```
[ 📎 ]  [ textarea (flex-grow)          ] [ ↑ ]
[ 🎤 ]
```

When files are attached, chips appear **above** the input row. When voice dictation is active, an interim transcript row appears **below the chips row** (or at top of input area if no chips):

```
[ 📄 appraisal.pdf ✕ ]  [ 🖼 front.jpg ✕ ]   ← attachment chips row
[ 🔴 Listening: "what is the DTI on…"      ]   ← interim voice row (only while listening)
[ 📎 ]  [ textarea                       ] [ ↑ ]
[ 🎤 ]
```

Each chip shows an icon (📄 for PDF, 🖼 for image), the filename truncated to 20 chars, and an ✕ to remove. After a successful send, **attachment chips are cleared** from state and the `attachments` array resets to `[]`. This is consistent with the existing dark monospace theme (`#0f0f0f` bg, `#C9A84C` accent, IBM Plex Mono).

---

## 2. File & Image Attachment

### Supported types
- **Images:** `image/jpeg`, `image/png`, `image/webp`
- **Documents:** `application/pdf`

(`image/gif` excluded — large GIFs create disproportionate payload sizes.)

### Limits
- Max **1 MB** per file (enforced client-side before encoding)
- Max **3 files** per message
- Total base64-encoded payload across all attachments stays under ~4 MB, safely within Vercel's default 4.5 MB route handler limit (no `next.config` change needed — see §2 Server section)
- Clear inline error message below input if either limit exceeded

### Client flow
1. User taps 📎 → hidden `<input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf">` fires via `ref.current.click()`
2. Each selected file is validated for size and count
3. Valid files are read with `FileReader.readAsDataURL()`. The `onerror` callback shows an inline error: "Could not read [filename] — please try again."
4. On successful read, the data URI prefix (`data:<mime>;base64,`) is **stripped client-side** before storing in state, so `attachments[i].data` is always the raw base64 string
5. Chips render above input; ✕ removes the entry from state
6. On send, `attachments` array is included in the POST body

### POST body shape
```ts
type Attachment = {
  type: 'image' | 'pdf'
  mimeType: string       // e.g. 'image/jpeg', 'application/pdf'
  name: string           // original filename, for display only
  data: string           // raw base64 — NO data URI prefix
}

// POST /api/chat body
{
  messages: Message[],
  recordId?: string,
  recordType?: string,
  sessionId?: string,
  selectedContacts?: SelectedContact[],
  generateType?: 'email' | 'text',
  attachments?: Attachment[]
}
```

### Server changes (`/api/chat/route.ts`)

**Body size**: No `export const config` — that syntax is Pages Router only and is silently ignored in App Router route handlers. The 1 MB per file / 3 file cap keeps the total encoded payload ≤ ~4 MB, within Vercel's default 4.5 MB limit. No `next.config` changes required.

**New helper** with explicit signature:
```ts
import type { MessageParam, ContentBlockParam } from '@anthropic-ai/sdk/resources/messages'

function buildUserContent(
  text: string,
  attachments: Attachment[]
): ContentBlockParam[] {
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
          media_type: 'application/pdf',
          data: att.data,
        },
      })
    }
  }

  blocks.push({ type: 'text', text })
  return blocks
}
```

**Integration with tool-use loop**: When `attachments` are present, the **last user message** in `apiMessages` is replaced with a multimodal content array via `buildUserContent`. This replacement is done **once** before the first Anthropic call and the resulting `apiMessages` array is reused unchanged in the second call (tool result call). Both calls see the attachments — the tool-use loop does not reconstruct `apiMessages`:

```ts
const lastMsg = apiMessages[apiMessages.length - 1]
if (attachments?.length && lastMsg.role === 'user') {
  lastMsg.content = buildUserContent(lastMsg.content as string, attachments)
}
// apiMessages is now multimodal — pass to both anthropic.messages.create() calls
```

**Attachments are not persisted** to `chat_sessions` — the session save strips them, storing only the text content of each message.

---

## 3. Voice Dictation

### Dependency
`@types/dom-speech-recognition` added as a **devDependency** (zero runtime bytes — types only). This resolves the TypeScript `SpeechRecognition` type without casting to `any`.

### Behavior
- **Tap to start:** mic button turns gold and pulses, `SpeechRecognition` starts with `continuous: true`, `interimResults: true`
- An interim transcript row appears above the input area showing real-time partial text
- **Tap to stop:** recognition ends; final transcript is **appended** to whatever is in the textarea (does not overwrite, does not auto-send — user reviews and edits first)
- Interim row disappears after stopping
- If `SpeechRecognition` is unavailable (check: `typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)`), the mic button is **hidden** — no error shown

### State
```ts
const [isListening, setIsListening] = useState(false)
const [interimTranscript, setInterimTranscript] = useState('')
const recognitionRef = useRef<SpeechRecognition | null>(null)
```

### Cleanup
`recognitionRef.current?.stop()` called in `useEffect` cleanup and when the chat panel closes (`isOpen` goes false).

---

## 4. Expand / Full-Screen Mode

### Trigger
`⤢` button added to the right side of the chat header, left of the existing close button.

### Behavior
- `⤢` sets `isExpanded = true` → chat renders as `position: fixed; inset: 0; z-index: 9000` (verify safe against existing app modals — if any modal uses z-index > 9000, increase accordingly)
- `⤡` or **Esc** collapses back to corner float
- In expanded mode the message list grows via `flex: 1` to fill the viewport height
- All existing functionality (record context, bulk outreach, quick actions) works identically

### State
```ts
const [isExpanded, setIsExpanded] = useState(false)
```

`useEffect` adds `keydown` listener for Esc when `isExpanded` is true, removes it on cleanup.

---

## 5. Screen Reading (Current Behavior — No Change)

The bot already reads the current page's data via the dynamically built system prompt:
- **Contact page** — all contact fields + associated loan
- **Loan page** — all loan fields + borrower contact
- **Any page** — active pipeline (20 loans) + contact counts

Manual screenshot upload (via the new attachment feature) covers the need for sharing visual page state. Automatic screen capture is out of scope for this version.

---

## 6. Files Changed

| File | Change |
|------|--------|
| `src/components/crm/LoanOSChat.tsx` | Attachment state + file reader; voice state + SpeechRecognition; expand state + Esc handler; reworked input area layout |
| `src/app/api/chat/route.ts` | `buildUserContent` helper; multimodal last-message replacement before both Anthropic calls |
| `package.json` | Add `@types/dom-speech-recognition` to `devDependencies` |

No new runtime dependencies. No database changes. No new API routes. No `next.config` changes.

---

## 7. Out of Scope

- Audio playback of Claude's responses (text-to-speech output)
- Automatic page screenshot ("share screen" button)
- File persistence / attachment history
- Word document support (`.docx`) — PDFs only
- Drag-and-drop file upload (tap/click only)
- Raising the body size limit beyond Vercel defaults (requires Vercel Pro + `next.config` changes)
