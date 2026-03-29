# Enterprise Social Media — Multi-Tenant Customization Spec

Date: 2026-03-29
Author: Claude Code (PM Session)
Status: SPEC COMPLETE — Ready for build queue
Depends on: Phase 3 LO Onboarding (spec 2026-03-27), existing `social_drafts` / `social_settings` / `social_activity` tables

---

## Problem

The social media dashboard works for Adam's org today, but it's hardcoded in several ways:
1. **Publer credentials** are constants in `/api/social/publish/route.ts` (workspace ID, account IDs, API key)
2. **Content pillars** are a fixed DB check constraint (`education`, `authority`, `story`, `market`, `personal`)
3. **Agent prompts** reference "Adam Styer | Mortgage Solutions LP" and NMLS# 513013
4. **Voice guide** requires manual markdown editing — no guided onboarding
5. **Platform list** is fixed to Instagram, LinkedIn, Facebook — no way to add/remove per org

A new LO signing up sees an empty social media tab with no voice guide, no platform connections, and no way to generate content that sounds like them.

**Goal:** New LO goes from zero to "I have a voice guide and my first 7 posts drafted" in under 15 minutes.

---

## What Already Works Multi-Tenant

| Component | Multi-tenant? | How |
|-----------|:---:|-----|
| `social_drafts` | ✅ | RLS scoped to `organization_id` |
| `social_activity` | ✅ | RLS scoped to `organization_id` |
| `social_settings` | ✅ | RLS scoped to `organization_id`, key-value store |
| Voice guide | ✅ | Stored per-org in `social_settings` key `voice_guide` |
| Claude system prompt | ✅ | Pulls voice guide dynamically from DB at request time |
| Publer publish | ❌ | Hardcoded credentials in route.ts |
| Content pillars | ❌ | DB check constraint — same 5 for all orgs |
| Agent prompts | ❌ | Hardcoded company name, NMLS# |
| Platform accounts | ❌ | Hardcoded in route.ts |

---

## Build Plan — 5 Components

### Component 1: Voice Guide Onboarding Wizard

**What:** A guided 5-step flow that builds a complete voice guide from simple questions. Replaces the blank markdown editor for new LOs.

**Where:** `/dashboard/marketing` — shows as a full-panel wizard when `social_settings` has no `voice_guide` key (or key value is empty/default).

**Wizard Steps:**

| Step | Question | Input Type | Purpose |
|------|----------|-----------|---------|
| 1 | "How would you describe your communication style?" | Multi-select chips: Direct, Warm, Educational, Funny, Professional, Casual, Inspirational | Sets tone parameters |
| 2 | "What markets do you serve?" | Text input + state multi-select | Geographic targeting for content |
| 3 | "What loan types do you specialize in?" | Multi-select chips: Conventional, FHA, VA, USDA, Jumbo, Reverse, Non-QM, DSCR, Construction | Product focus areas |
| 4 | "What topics do you want to post about?" | Pillar picker (see Component 2) — toggle on/off, rename, add custom | Content categories |
| 5 | "Paste 2-3 social posts you've written that you like" | Textarea (optional) | Voice sample for Claude to analyze |

**On completion:**
1. Send all answers to `/api/social/voice-wizard` (new endpoint)
2. Claude assembles a full voice guide markdown document from the answers
3. Store in `social_settings` key `voice_guide`
4. Show the generated guide in the existing voice guide editor so LO can tweak it
5. Optionally trigger "Generate 7 starter posts" (Component 5)

**Database:** No schema changes — uses existing `social_settings` key-value store. Wizard answers also stored as `social_settings` key `voice_wizard_answers` (JSON) so the wizard can be re-run.

**New API Route:** `POST /api/social/voice-wizard`

```typescript
// Request body
{
  style: string[]         // ["direct", "educational"]
  markets: string[]       // ["Austin, TX", "Round Rock, TX"]
  loanTypes: string[]     // ["conventional", "fha", "va"]
  pillars: string[]       // ["education", "authority", "story"]
  samplePosts: string     // optional — raw text of example posts
}

// Response
{
  voiceGuide: string      // Full markdown voice guide
}
```

**Claude prompt for guide generation:**
```
You are building a social media voice guide for a mortgage loan officer.

Company: {{org.name}}
NMLS#: {{org.nmls}}
Style: {{style}}
Markets: {{markets}}
Loan specialties: {{loanTypes}}
Content pillars: {{pillars}}

{{#if samplePosts}}
Here are example posts they've written (analyze their actual voice):
{{samplePosts}}
{{/if}}

Generate a complete voice guide in markdown that covers:
1. Voice & tone description (2-3 sentences)
2. Do's and don'ts (5 each)
3. Signature phrases / recurring themes
4. Hashtag strategy per platform
5. Compliance guardrails (NMLS#, no rate guarantees, Equal Housing)
6. Post structure templates per format (single image, carousel, video, text)
```

---

### Component 2: Content Pillar Picker

**What:** Each org configures their own content pillars instead of using the hardcoded 5.

**Current state:** `social_drafts.pillar` has a CHECK constraint: `('education', 'authority', 'story', 'market', 'personal')`. This blocks any custom values.

**Migration:**

```sql
-- Migration: Drop hardcoded pillar check constraint, replace with org-level validation
ALTER TABLE social_drafts DROP CONSTRAINT social_drafts_pillar_check;

-- pillar is now freeform text — validated at application layer against org's configured pillars
-- Keep NOT NULL removed (pillar is already nullable)
```

**Storage:** `social_settings` key `pillars` — JSON array of pillar objects:

```json
[
  { "id": "education", "label": "Education", "active": true },
  { "id": "authority", "label": "Authority & Social Proof", "active": true },
  { "id": "story", "label": "Personal Story", "active": true },
  { "id": "market", "label": "Market Updates", "active": false },
  { "id": "personal", "label": "Personal / Faith", "active": true },
  { "id": "custom_1", "label": "Client Wins", "active": true }
]
```

**Default pillars:** When no `pillars` key exists, the system falls back to the current 5. The wizard (Step 4) pre-populates these and lets the LO toggle/rename/add.

**UI:** In the wizard (Step 4) and in the Voice Guide settings panel — a list of pills with toggle switches, inline rename, and "Add Pillar" button.

**Validation:** The compose panel and agent both read the org's pillars from `social_settings` at runtime. The API validates `pillar` values against the org's configured list before insert.

---

### Component 3: Platform Connections (Publer Per-Org)

**What:** Each org connects their own Publer workspace + accounts. The publish endpoint reads credentials from DB instead of hardcoded constants.

**Storage:** `social_settings` keys:

| Key | Value (JSON) | Example |
|-----|-------------|---------|
| `publer_api_key` | Encrypted API key string | `"14ff59c2..."` |
| `publer_workspace` | Workspace ID string | `"69b052bf..."` |
| `publer_accounts` | JSON object mapping platform → account ID | `{"instagram":"69b053...","linkedin":"69b053...","facebook":"69b053..."}` |

**Migration:** None — uses existing `social_settings` table.

**Encryption:** API keys should be encrypted at rest. Two options:
- **Option A (simpler):** Store as-is in `social_settings.value` (same security as current hardcoded key in source code — actually better since DB has RLS). Accept for MVP.
- **Option B (better):** Use Supabase Vault (`pgsodium`) to store secrets. Reference the secret ID in `social_settings`.

**Recommendation:** Option A for MVP. The key is already exposed in the source code today. Moving it to per-org DB storage with RLS is strictly more secure.

**Publish route changes (`/api/social/publish/route.ts`):**

```typescript
// BEFORE (hardcoded)
const PUBLER_API_KEY = '14ff59c284cf0e2d...'
const PUBLER_WORKSPACE = '69b052bf835c8c...'
const PLATFORM_ACCOUNTS = { instagram: '69b053...', ... }

// AFTER (per-org from DB)
const { data: apiKeyRow } = await supabase
  .from('social_settings').select('value')
  .eq('organization_id', organizationId)
  .eq('key', 'publer_api_key').maybeSingle()

const { data: workspaceRow } = await supabase
  .from('social_settings').select('value')
  .eq('organization_id', organizationId)
  .eq('key', 'publer_workspace').maybeSingle()

const { data: accountsRow } = await supabase
  .from('social_settings').select('value')
  .eq('organization_id', organizationId)
  .eq('key', 'publer_accounts').maybeSingle()

if (!apiKeyRow || !workspaceRow || !accountsRow) {
  return NextResponse.json({ error: 'Publer not connected. Go to Marketing → Settings to connect.' }, { status: 400 })
}
```

**Connection UI:** A "Platform Connections" section in the marketing settings panel:
1. "Connect Publer" button → opens a form asking for API key and workspace ID
2. After entering those, fetch `GET https://api.publer.io/v1/workspaces/:id/accounts` to auto-discover connected social accounts
3. Display the accounts with checkboxes — LO selects which to enable
4. Save to `social_settings`

**Fallback for Adam's org:** Seed Adam's current Publer credentials into `social_settings` so nothing breaks when the hardcoded values are removed.

---

### Component 4: Compliance Profile

**What:** Per-org compliance settings injected into every agent prompt and enforced as guardrails.

**What already exists in `organizations` table:**
- `nmls` — already stored
- `name` — already stored (company name)
- `logo_url`, `brand_color` — already stored

**Additional settings needed** (stored in `social_settings`):

| Key | Type | Purpose |
|-----|------|---------|
| `compliance_equal_housing` | `"true"/"false"` | Whether Equal Housing Lender logo/text required |
| `compliance_state_disclaimers` | JSON array of strings | State-specific disclaimers to include |
| `compliance_forbidden_phrases` | JSON array of strings | Phrases Claude must never use (e.g., "guaranteed approval") |
| `compliance_required_disclosures` | JSON array of strings | Disclosures required when mentioning rates/products |

**Default compliance profile** (seeded for every new org):
```json
{
  "compliance_equal_housing": "true",
  "compliance_forbidden_phrases": [
    "guaranteed approval",
    "you will be approved",
    "100% approval rate",
    "no credit check"
  ],
  "compliance_required_disclosures": [
    "NMLS# required on posts mentioning rates, loan products, or mortgage services",
    "No specific rate percentages without APR disclosure"
  ]
}
```

**Agent prompt injection:** The `buildSocialSystemPrompt()` function in `/api/chat/social/route.ts` already pulls the voice guide dynamically. Extend it to also pull compliance settings:

```typescript
// Pull org details
const { data: org } = await supabase
  .from('organizations')
  .select('name, nmls')
  .eq('id', organizationId)
  .single()

// Pull compliance settings
const { data: complianceRows } = await supabase
  .from('social_settings')
  .select('key, value')
  .eq('organization_id', organizationId)
  .in('key', ['compliance_equal_housing', 'compliance_forbidden_phrases', 'compliance_required_disclosures', 'compliance_state_disclaimers'])

// Build compliance block for system prompt
const complianceBlock = `
## Compliance Profile
- Company: ${org.name}
- NMLS#: ${org.nmls || 'Not set'}
- Equal Housing Lender: ${equalHousing ? 'Required on all posts' : 'Not required'}
- Forbidden phrases: ${forbidden.join(', ')}
- Required disclosures: ${disclosures.join('; ')}
${stateDisclaimers.length ? `- State disclaimers: ${stateDisclaimers.join('; ')}` : ''}

CRITICAL: Never use forbidden phrases. Always include NMLS# when mentioning rates or loan products.
Business name: ${org.name} (use exactly as written — no variations).
`
```

**UI:** A "Compliance" section in marketing settings — simple form with the org name (read-only, from org settings), NMLS# (read-only), toggle for Equal Housing, and editable lists for forbidden phrases and required disclosures.

---

### Component 5: Auto-Generate Starter Posts

**What:** After the voice guide wizard completes, offer a "Generate 7 Starter Posts" button that creates a week of content using the new voice guide.

**Flow:**
1. Voice guide wizard completes → success screen shows
2. "Generate Your First Week of Content" button (gold, prominent)
3. Calls `POST /api/social/generate-batch` with `{ count: 7 }`
4. Backend reads the org's voice guide, pillars, and compliance profile
5. Claude generates 7 posts across the active pillars and platforms
6. Each post inserted as a `social_draft` with status `draft`
7. LO lands on the social media dashboard with 7 posts to review

**New API Route:** `POST /api/social/generate-batch`

```typescript
// Request
{ count: number }  // 7 default, max 14

// Claude prompt
`Generate {{count}} social media posts for the upcoming week.

${voiceGuide}
${complianceBlock}

Active pillars: ${pillars.map(p => p.label).join(', ')}
Active platforms: ${platforms.join(', ')}

Rules:
- Distribute posts evenly across pillars and platforms
- Vary formats: mix single image, carousel, text only, reel script
- Each post should have: title, content, platform, format, pillar, hashtags
- Return as JSON array

Return format:
[{
  "title": "string",
  "content": "string",
  "platform": "instagram|linkedin|facebook",
  "format": "single_image|carousel|video|reel_script|text_only",
  "pillar": "string (from active pillars)",
  "hashtags": "string"
}]`
```

**Response:** Inserts all posts, returns count and draft IDs.

---

## Migration Plan

### Migration 070 — Remove hardcoded pillar constraint

```sql
-- Allow custom pillar values (validated at application layer per org)
ALTER TABLE social_drafts DROP CONSTRAINT IF EXISTS social_drafts_pillar_check;

-- Also add 'gbp' to platform constraint for Google Business Profile support
ALTER TABLE social_drafts DROP CONSTRAINT IF EXISTS social_drafts_platform_check;
ALTER TABLE social_drafts ADD CONSTRAINT social_drafts_platform_check
  CHECK (platform = ANY(ARRAY['instagram', 'linkedin', 'facebook', 'gbp', 'tiktok', 'all']));
```

### Data seed — Adam's Publer credentials to social_settings

```sql
-- Move Adam's hardcoded Publer credentials to per-org settings
INSERT INTO social_settings (organization_id, key, value) VALUES
  ('18613f82-fdd9-42dd-a09e-f3c577328258', 'publer_api_key', '14ff59c284cf0e2d0720672cf1e1ccdc81af5fa56f8a88c2'),
  ('18613f82-fdd9-42dd-a09e-f3c577328258', 'publer_workspace', '69b052bf835c8c689fab8fd8'),
  ('18613f82-fdd9-42dd-a09e-f3c577328258', 'publer_accounts', '{"instagram":"69b0530110a77a0ed895847d","linkedin":"69b0536404b824ffb2c05426","facebook":"69b05329de86f5e15b7c0722"}')
ON CONFLICT (organization_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```

### Data seed — Default compliance profile for Adam

```sql
INSERT INTO social_settings (organization_id, key, value) VALUES
  ('18613f82-fdd9-42dd-a09e-f3c577328258', 'compliance_equal_housing', 'true'),
  ('18613f82-fdd9-42dd-a09e-f3c577328258', 'compliance_forbidden_phrases', '["guaranteed approval","you will be approved","100% approval rate","no credit check"]'),
  ('18613f82-fdd9-42dd-a09e-f3c577328258', 'compliance_required_disclosures', '["NMLS# required on posts mentioning rates, loan products, or mortgage services","No specific rate percentages without APR disclosure"]')
ON CONFLICT (organization_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```

---

## Build Sequence

| Order | Component | Effort | Depends On |
|:-----:|-----------|--------|-----------|
| 1 | Migration 070 (pillar constraint + platform expansion) | 15 min | Nothing |
| 2 | Data seed (Adam's Publer + compliance to social_settings) | 15 min | Migration 070 |
| 3 | Component 3: Platform Connections (publish route reads from DB) | 1 hour | Data seed |
| 4 | Component 4: Compliance Profile (prompt injection) | 1 hour | Data seed |
| 5 | Component 2: Content Pillar Picker (settings UI + validation) | 1 hour | Migration 070 |
| 6 | Component 1: Voice Guide Wizard (multi-step flow + Claude generation) | 2 hours | Components 2, 4 |
| 7 | Component 5: Auto-Generate Starter Posts (batch endpoint) | 1 hour | Components 1, 4 |

**Total estimate:** ~6 hours of build time across 2-3 sessions.

---

## Files to Create / Modify

### New Files
- `src/app/api/social/voice-wizard/route.ts` — Voice guide generation from wizard answers
- `src/app/api/social/generate-batch/route.ts` — Batch post generation
- `src/app/dashboard/marketing/_components/VoiceWizard.tsx` — 5-step wizard UI
- `src/app/dashboard/marketing/_components/PillarPicker.tsx` — Pillar config UI
- `src/app/dashboard/marketing/_components/PlatformConnections.tsx` — Publer connection UI
- `src/app/dashboard/marketing/_components/ComplianceSettings.tsx` — Compliance profile UI
- `supabase/migrations/070_social_pillar_platform_expansion.sql`

### Modified Files
- `src/app/api/social/publish/route.ts` — Read Publer credentials from DB instead of constants
- `src/app/api/chat/social/route.ts` — Inject compliance profile into system prompt; template org name/NMLS
- `src/app/dashboard/marketing/_components/SocialComposePanel.tsx` — Read org pillars for picker
- `src/app/dashboard/marketing/page.tsx` — Show wizard when no voice guide exists

---

## UX Flow for New LO

```
1. LO signs up → creates org → lands on dashboard
2. Clicks "Marketing" tab → sees empty state with wizard CTA
3. Wizard Step 1: Pick communication style chips
4. Wizard Step 2: Enter markets served
5. Wizard Step 3: Pick loan type specialties
6. Wizard Step 4: Configure content pillars (toggle defaults, add custom)
7. Wizard Step 5: Paste sample posts (optional)
8. → Claude generates voice guide → preview + edit screen
9. "Generate Your First Week" button → 7 draft posts created
10. LO lands on social media dashboard with 7 posts to review/approve
11. Later: Connect Publer in Settings → publish approved posts
```

**Time to first value: ~10 minutes** (voice guide + 7 posts ready to review)

---

## Edge Cases

| Scenario | Handling |
|----------|---------|
| LO skips wizard | Empty state persists with "Set Up Your Voice" CTA. Can compose posts manually but Claude uses generic voice. |
| LO has no Publer account | Everything works except publish. Show "Connect Publer to publish" message on PUBLISH button. Posts can still be exported as text. |
| LO changes voice guide after posts exist | Existing posts keep their content. New posts use updated guide. No retroactive rewrite. |
| LO on free plan | Wizard and 7 starter posts included. Batch generation limited to 7/week. Upgrade CTA for unlimited. |
| Custom pillar used in old posts, then LO removes pillar | Posts keep their pillar value. Pillar just won't appear in the picker for new posts. No cascade delete. |
