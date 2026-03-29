# Social Media Dashboard — Design Spec
Date: 2026-03-29
Status: APPROVED

---

## Summary

A new "SOCIAL" tab inside the Marketing section of LoanOS that gives Adam visibility into everything the social media agent produces, plus the ability to review, edit, compose, and communicate with Claude — all in one place. Also adds a "VOICE GUIDE" tab for editing the voice/workflow document directly from the UI.

---

## Problem

The social media agent generates content (posts, calendars, research) but everything lives in markdown files buried in `tasks/social-media/`. Adam has never seen the actual posts. There's no way to review, approve, edit, or interact with agent output without digging through files manually.

---

## Decisions (from brainstorm)

| Decision | Choice |
|----------|--------|
| Layout | List + Side Panel (email-client style) |
| Chat | Scoped — Claude sees selected post + voice guide automatically |
| Voice guide | Full tab for editing + quick-view drawer from post detail |
| Activity feed | Simple chronological log at top of social tab |
| Compose mode | NEW POST button → prompt + media upload + format/platform picker |

---

## Architecture

### New Supabase Tables

**social_drafts**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
organization_id uuid NOT NULL REFERENCES organizations(id)
platform        text NOT NULL  -- 'instagram' | 'linkedin' | 'facebook' | 'all'
format          text           -- 'single_image' | 'carousel' | 'video' | 'reel_script' | 'text_only' | null (let claude decide)
pillar          text           -- content pillar: 'education' | 'authority' | 'story' | 'market' | 'personal'
title           text NOT NULL
content         text NOT NULL  -- the post body / caption
hashtags        text           -- comma-separated
media_urls      text[]         -- array of Supabase Storage URLs
status          text NOT NULL DEFAULT 'draft'  -- 'draft' | 'approved' | 'scheduled' | 'posted' | 'rejected'
scheduled_for   timestamptz    -- when it should go live
agent_notes     text           -- agent's reasoning, compliance flags, format recommendations
publer_post_id  text           -- Publer's ID once pushed
created_by      text NOT NULL DEFAULT 'agent'  -- 'agent' | 'user'
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()
```

**social_activity**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
organization_id uuid NOT NULL REFERENCES organizations(id)
action          text NOT NULL  -- 'generated_posts' | 'research' | 'scheduled' | 'error' | 'compose'
detail          text NOT NULL  -- human-readable description
session_id      text           -- links to agent session
created_at      timestamptz NOT NULL DEFAULT now()
```

**social_settings**
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
organization_id uuid NOT NULL REFERENCES organizations(id)
key             text NOT NULL  -- 'voice_guide'
value           text NOT NULL  -- markdown content
updated_at      timestamptz NOT NULL DEFAULT now()
UNIQUE(organization_id, key)
```

### New API Route

**POST /api/chat/social** — Scoped chat for social media editing
- System prompt includes: voice guide (from social_settings), selected draft content, platform, format
- Same Anthropic client pattern as existing /api/chat
- On response, optionally updates the draft content in social_drafts if Claude generates a rewrite
- Supports compose mode: if no draft selected, generates a new draft from user prompt

### New Files

```
src/app/dashboard/marketing/_components/
├── SocialTab.tsx              -- main container: activity feed + list/detail split
├── SocialDraftList.tsx        -- left panel: filterable draft list + NEW POST button
├── SocialDraftDetail.tsx      -- right panel: preview, edit, approve/reject, agent notes
├── SocialComposePanel.tsx     -- compose mode: prompt, media upload, format/platform picker
├── SocialChat.tsx             -- scoped chat input + message display
├── SocialActivityFeed.tsx     -- horizontal scrolling activity log strip
├── VoiceGuideEditor.tsx       -- full-tab markdown editor (VOICE GUIDE tab)
├── VoiceGuideDrawer.tsx       -- slide-out read/edit panel from post detail
src/app/api/chat/social/
└── route.ts                   -- scoped Claude chat endpoint
```

### Modified Files

```
src/app/dashboard/marketing/page.tsx    -- add SOCIAL and VOICE GUIDE tabs
src/components/TopNav.tsx               -- add 'Social Media' to Marketing dropdown
src/lib/marketing/types.ts              -- add SocialDraft, SocialActivity types
```

---

## UI Layout

### Social Tab

```
┌─────────────────────────────────────────────────────────────┐
│ RECENT ACTIVITY                                             │
│ 🟢 3h ago — Generated 3 IG posts  🟢 Yesterday — Research  │
├──────────────┬──────────────────────────────────────────────┤
│ [+ NEW POST] │  Post Title                                  │
│ ──────────── │  Platform · Pillar · Scheduled date          │
│ Filter: ALL  │                                              │
│ DRAFT        │  ┌─────────────────────────────────┐         │
│ APPROVED     │  │ POST CONTENT                     │         │
│ SCHEDULED    │  │ (preview / inline edit)           │         │
│ ──────────── │  └─────────────────────────────────┘         │
│ ▸ Post #12   │                                              │
│   Post #11   │  [APPROVE] [EDIT] [REJECT]  [VOICE GUIDE]   │
│   Post #10   │                                              │
│   Post #9    │  AGENT NOTES                                 │
│   ...        │  Pillar: Education. No compliance flags...   │
│              │                                              │
│              │  ─── CHAT ───────────────────────────        │
│              │  [Make it punchier...              ] [SEND]   │
│              │  Claude sees post + voice guide auto          │
├──────────────┴──────────────────────────────────────────────┤
```

### Compose Mode (replaces detail panel when NEW POST clicked)

```
┌──────────────────────────────────────────────────┐
│ COMPOSE NEW POST                          [CLOSE]│
│                                                  │
│ What's your idea?                                │
│ ┌──────────────────────────────────────────────┐ │
│ │ I want to talk about why locking your rate   │ │
│ │ immediately is the smart move...             │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Media (optional)                                 │
│ ┌──────────────────────────────────────────────┐ │
│ │  📎 Drag photos or video here, or click      │ │
│ └──────────────────────────────────────────────┘ │
│                                                  │
│ Platform:  [IG] [LI] [FB] [ALL]                  │
│ Format:    [Single] [Carousel] [Video] [Reel]    │
│            [Text] [✨ Let Claude Decide]          │
│                                                  │
│            [GENERATE POST]                       │
└──────────────────────────────────────────────────┘
```

---

## Data Flow

### Agent → Dashboard
1. Agent runs (master-agent.md, 2x daily)
2. Agent writes drafts to `social_drafts` table (status: 'draft')
3. Agent writes session actions to `social_activity` table
4. Dashboard reads both tables on load + polls for updates

### User Compose → Draft
1. User clicks NEW POST, types idea, optionally uploads media
2. POST /api/chat/social with compose=true, prompt, media, format, platform
3. Claude generates post using voice guide as context
4. New row inserted into social_drafts (status: 'draft', created_by: 'user')
5. Draft appears in list, user reviews/edits

### User Review → Approve
1. User clicks draft in list → detail panel shows preview
2. User edits inline or chats with Claude to refine
3. User clicks APPROVE → status changes to 'approved'
4. Future: approved posts get pushed to Publer API

### Voice Guide
1. On first load: seed social_settings from adam-voice-and-workflow.md content
2. User edits in VOICE GUIDE tab → saves to social_settings table
3. All chat/compose calls read voice guide from social_settings (not the file)
4. The repo file becomes a backup/snapshot

---

## Compliance

- All existing compliance guardrails from the voice guide are enforced via the system prompt
- Agent notes field flags any compliance concerns (rate mentions, missing NMLS#)
- Posts with compliance flags get a visual indicator in the draft list

---

## Out of Scope (for now)

- Publer API integration (push approved posts) — future phase
- Image generation / Canva integration
- Calendar view toggle
- Drag-and-drop reordering
- Analytics / post performance tracking
- Multi-user support
