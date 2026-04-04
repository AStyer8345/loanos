# Lender Knowledge System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete lender knowledge system — structured Supabase data + NotebookLM deep knowledge + dashboard UI + auto-ingest pipeline — so any LO in the org can look up lender contacts, products, and guidelines.

**Architecture:** Two-layer knowledge: Supabase `lenders` table for structured lookups (AE contacts, products, channels) accessed via `query_lender_database` tool + NotebookLM notebook for deep guideline/overlay questions accessed via `query_mortgage_knowledge_base` tool. Dashboard page reads from Supabase with org RLS. n8n workflow monitors Outlook for lender emails and feeds both layers automatically.

**Tech Stack:** Next.js 14 (App Router), Supabase (postgres + RLS), shadcn/ui + Tailwind, n8n (workflow automation), NotebookLM (knowledge base), Anthropic Claude API (email extraction)

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/app/dashboard/lenders/page.tsx` | Server component — fetches lenders from Supabase, renders `<LendersClient>` |
| `src/app/dashboard/lenders/LendersClient.tsx` | Client component — search, filter, card grid, detail expansion |
| `src/components/lenders/LenderCard.tsx` | Single lender card — name, channel badge, AE contacts, product tags, website |
| `src/components/lenders/LenderFilters.tsx` | Search input + channel filter + product tag filter |

### Modified Files
| File | Change |
|------|--------|
| `src/components/TopNav.tsx` | Add "Lenders" nav item between Marketing and Drip |
| Supabase `lenders` table (via SQL) | Update Deephaven, Ameris; insert Champions Funding, FCM TPO |
| NotebookLM notebook `3489e177` | Add text sources for Deephaven HELOC, Ameris Non-QM, Champions, FCM guidelines |
| n8n (new workflow) | "LoanOS — Lender Email Ingest" workflow |

---

## Task 1: Update Deephaven in Supabase

**Files:**
- Modify: Supabase `lenders` table via `execute_sql` MCP

- [ ] **Step 1: Run the update SQL**

Use `mcp__e3151559__execute_sql` with project ID `uuqedsvjlkeszrbwzizl`:

```sql
UPDATE public.lenders
SET
  specialty_products = ARRAY[
    'Digital HELOC',
    'Expanded Prime',
    'Non Prime',
    'DSCR 1-4 Unit',
    'DSCR 5-9 Unit',
    'ITIN',
    'Jumbo',
    'Super Jumbo',
    'Equity Advantage',
    'Closed End Seconds',
    'Bank Statement',
    'Asset Depletion'
  ],
  notes = 'Digital HELOC: $50K-$400K, first & second lien, min 660 FICO, debt consolidation 50% DTI, bank statement income, co-borrowers allowed. Primary 90% CLTV / 2nd home 85% / Investment 75%. Expanded Prime: up to 90% LTV, 660+ FICO, 50% DTI, 1099/bank stmt/asset depletion income. Non Prime: recent credit events OK, 500+ FICO, manual UW available. DSCR 1-4: no income/employment verification, 75-80% LTV, 620+ FICO. DSCR 5-9: small balance commercial, 5-9 unit residential. Jumbo: up to $3M, 680+ FICO. Super Jumbo: $3M-$6M. ITIN: Individual Taxpayer ID loans, 660+ FICO. Equity Advantage: 2nd lien up to 90% CLTV. Closed End Seconds: fixed-rate 2nd mortgages.',
  updated_at = now()
WHERE name = 'Deephaven'
  AND organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258';
```

- [ ] **Step 2: Verify the update**

```sql
SELECT name, specialty_products, notes FROM public.lenders
WHERE name = 'Deephaven' AND organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258';
```

Expected: Row shows all 12 specialty products and updated notes.

---

## Task 2: Update Ameris Bank in Supabase

**Files:**
- Modify: Supabase `lenders` table via `execute_sql` MCP

- [ ] **Step 1: Run the update SQL**

```sql
UPDATE public.lenders
SET
  specialty_products = ARRAY[
    'Non-QM',
    'Bank Statement',
    'DSCR',
    'Asset Depletion',
    'Foreign National',
    'ITIN',
    '1099 Only',
    'Jumbo',
    'Interest Only',
    'Recent Credit Events'
  ],
  notes = 'Ameris Bank Non-QM division. Bank Statement: 12 or 24 month personal/business, up to 90% LTV, 620+ FICO. DSCR: no income verification, investment properties, min 0.75 DSCR ratio. Asset Depletion: qualify on liquid assets, 60-month or 84-month depletion. Foreign National: passport-based lending. ITIN: Individual Taxpayer ID, up to 80% LTV. 1099 Only: 1 or 2 year 1099s, no tax returns. Interest Only options available on most products. Recent Credit Events: 1 day out of BK/FC/SS on select programs.',
  updated_at = now()
WHERE name = 'Ameris Bank'
  AND organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258';
```

- [ ] **Step 2: Verify the update**

```sql
SELECT name, specialty_products, notes FROM public.lenders
WHERE name = 'Ameris Bank' AND organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258';
```

Expected: Row shows 10 specialty products and Non-QM notes.

---

## Task 3: Add Champions Funding to Supabase

**Files:**
- Modify: Supabase `lenders` table via `execute_sql` MCP

- [ ] **Step 1: Insert Champions Funding**

```sql
INSERT INTO public.lenders (organization_id, name, channel, website, contacts, specialty_products, notes)
VALUES (
  '18613f82-fdd9-42dd-a09e-f3c577328258',
  'Champions Funding',
  'Broker Only',
  'https://champstpo.com',
  '[
    {"name": "Jamee Lyon", "phone": "", "email": "", "role": "Account Executive"},
    {"name": "Dylan Sundell", "phone": "", "email": "", "role": "Account Executive"}
  ]'::jsonb,
  ARRAY[
    'Non-QM',
    'CDFI',
    'DSCR 1-4 Unit',
    'DSCR 5-8 Unit',
    'ITIN',
    'ITIN DSCR',
    'Foreign National',
    'Bank Statement',
    'Asset Depletion',
    'Super Jumbo',
    'No Income/Employment',
    'Full Doc Non-QM'
  ],
  'Champions Funding — Non-QM + CDFI wholesale lender, NMLS #2254210. Full-Doc: 90% LTV, 640 FICO, up to $3M. Alt-Doc (bank stmt/asset depletion/P&L): 85% LTV, 640 FICO, up to $3M. ITIN Alt-Doc: 85% LTV, 660 FICO, up to $1M. Foreign National: 75% LTV, 700 FICO, up to $3M. Super Jumbo: 70% LTV, 720 FICO, up to $5M. No Income/Employment: 80% LTV, 620 FICO, up to $2.5M. DSCR 1-4 unit: 85% LTV, 620 FICO, up to $3M. DSCR 5-8 unit: 75% LTV, 700 FICO, up to $2M. ITIN DSCR: 80% (DSCR>1.0), 660 FICO, up to $1M. Asset depletion feature for DSCR ratio boost. CDFI-designated: enhanced CRA credit for bank partners.'
)
ON CONFLICT (organization_id, name) DO UPDATE SET
  channel = EXCLUDED.channel,
  website = EXCLUDED.website,
  contacts = EXCLUDED.contacts,
  specialty_products = EXCLUDED.specialty_products,
  notes = EXCLUDED.notes,
  updated_at = now();
```

- [ ] **Step 2: Verify the insert**

```sql
SELECT name, channel, contacts, specialty_products FROM public.lenders
WHERE name = 'Champions Funding' AND organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258';
```

Expected: Row exists with 12 specialty products and 2 AE contacts.

---

## Task 4: Add FCM TPO to Supabase

**Files:**
- Modify: Supabase `lenders` table via `execute_sql` MCP

- [ ] **Step 1: Insert FCM TPO**

```sql
INSERT INTO public.lenders (organization_id, name, channel, website, broker_id, contacts, specialty_products, notes)
VALUES (
  '18613f82-fdd9-42dd-a09e-f3c577328258',
  'FCM TPO',
  'Correspondent',
  'https://fuel.fcmtpo.com',
  NULL,
  '[]'::jsonb,
  ARRAY[
    'Conventional',
    'FHA',
    'VA',
    'USDA',
    'Non-QM',
    'Jumbo',
    'Renovation'
  ],
  'FCM TPO (First Colony Mortgage) — NDC2/NDC3 Correspondent channel, NMLS #3112. Portal: fuel.fcmtpo.com. Fees: NDC2 $895, NDC3 $795, Streamline $695. FHA ID: 5222209998, VA ID: 9750740000. Full product suite: Conv/FHA/VA/USDA/Non-QM/Jumbo/Renovation. Delegated and non-delegated correspondent options.'
)
ON CONFLICT (organization_id, name) DO UPDATE SET
  channel = EXCLUDED.channel,
  website = EXCLUDED.website,
  broker_id = EXCLUDED.broker_id,
  contacts = EXCLUDED.contacts,
  specialty_products = EXCLUDED.specialty_products,
  notes = EXCLUDED.notes,
  updated_at = now();
```

- [ ] **Step 2: Verify the insert**

```sql
SELECT name, channel, notes FROM public.lenders
WHERE name = 'FCM TPO' AND organization_id = '18613f82-fdd9-42dd-a09e-f3c577328258';
```

Expected: Row exists with Correspondent channel and fee details in notes.

---

## Task 5: Feed NotebookLM with Lender Content

**Files:**
- External: NotebookLM notebook `3489e177-98de-4271-bbb8-d19145415718`

Uses the NotebookLM FastAPI bridge at `localhost:8001/add-source` endpoint OR the `notebooklm` CLI at `/Users/adamstyer/.local/bin/notebooklm`.

- [ ] **Step 1: Add Deephaven HELOC + product guide as text source**

```bash
/Users/adamstyer/.local/bin/notebooklm use 3489e177
/Users/adamstyer/.local/bin/notebooklm source add --text "Deephaven Mortgage — Full Product Guide (April 2026)

DIGITAL HELOC:
- Loan amounts: $50,000 - $400,000
- First and second lien positions
- Min 660 FICO
- Debt consolidation allowed up to 50% DTI
- Bank statement income qualification available
- Co-borrowers allowed on title and note
- Primary residence: up to 90% CLTV
- Second home: up to 85% CLTV
- Investment property: up to 75% CLTV
- No appraisal option on select scenarios

EXPANDED PRIME:
- Up to 90% LTV, 660+ FICO, 50% DTI
- Income types: W-2, 1099, bank statement (12/24 mo), asset depletion, P&L
- Primary, second home, investment

NON PRIME:
- Recent credit events accepted (BK, FC, SS, DIL)
- Min 500 FICO (manual UW available)
- Bank statement and alt-doc income

DSCR 1-4 UNIT:
- No income/employment verification
- 75-80% LTV, 620+ FICO
- Investment properties only
- Interest-only available

DSCR 5-9 UNIT:
- Small balance commercial
- 5-9 unit residential properties

ITIN:
- Individual Taxpayer ID loans
- 660+ FICO, up to 80% LTV

JUMBO: Up to $3M, 680+ FICO
SUPER JUMBO: $3M-$6M
EQUITY ADVANTAGE: 2nd lien up to 90% CLTV
CLOSED END SECONDS: Fixed-rate 2nd mortgages" --title "Deephaven Mortgage Product Guide"
```

- [ ] **Step 2: Add Champions Funding product matrix as text source**

```bash
/Users/adamstyer/.local/bin/notebooklm source add --text "Champions Funding — Non-QM + CDFI Wholesale Lender (NMLS #2254210)
Website: ChampsTPO.com
Account Executives: Jamee Lyon, Dylan Sundell

PRODUCT MATRIX:
Full-Doc Non-QM: 90% LTV, 640 FICO min, up to $3M loan amount
Alt-Doc (Bank Statement / Asset Depletion / P&L): 85% LTV, 640 FICO, up to $3M
ITIN Alt-Doc: 85% LTV, 660 FICO, up to $1M
Foreign National: 75% LTV, 700 FICO, up to $3M
Super Jumbo: 70% LTV, 720 FICO, up to $5M
No Income/No Employment: 80% LTV, 620 FICO, up to $2.5M
DSCR 1-4 Unit: 85% LTV, 620 FICO, up to $3M
DSCR 5-8 Unit: 75% LTV, 700 FICO, up to $2M
ITIN DSCR: 80% LTV (DSCR>1.0), 660 FICO, up to $1M

SPECIAL FEATURES:
- Asset depletion can be used to boost DSCR ratio
- CDFI-designated lender: enhanced CRA credit for bank partners
- Non-warrantable condos allowed on select programs
- Interest-only available on DSCR and investment products" --title "Champions Funding Product Matrix"
```

- [ ] **Step 3: Add Ameris Bank Non-QM guide as text source**

```bash
/Users/adamstyer/.local/bin/notebooklm source add --text "Ameris Bank — Non-QM Product Guide

BANK STATEMENT: 12 or 24 month personal/business statements, up to 90% LTV, 620+ FICO
DSCR: No income verification, investment properties, min 0.75 DSCR ratio
ASSET DEPLETION: Qualify on liquid assets, 60-month or 84-month depletion calculation
FOREIGN NATIONAL: Passport-based lending, no SSN required
ITIN: Individual Taxpayer ID, up to 80% LTV
1099 ONLY: 1 or 2 year 1099 forms, no tax returns required
INTEREST ONLY: Available on most Non-QM products
RECENT CREDIT EVENTS: 1 day out of BK/FC/SS on select programs

KEY DIFFERENTIATORS:
- One of the largest Non-QM lenders in wholesale channel
- Strong pricing on bank statement products
- Flexible asset depletion calculations (60 or 84 month)
- Day-1 out of credit event programs" --title "Ameris Bank Non-QM Guide"
```

- [ ] **Step 4: Add FCM TPO overview as text source**

```bash
/Users/adamstyer/.local/bin/notebooklm source add --text "FCM TPO (First Colony Mortgage) — Correspondent Channel Guide
NMLS #3112
Portal: fuel.fcmtpo.com

CHANNELS: NDC2 (Non-Delegated Correspondent Level 2), NDC3 (Non-Delegated Correspondent Level 3)

FEES:
- NDC2: $895 per loan
- NDC3: $795 per loan
- Streamline: $695 per loan

GOVERNMENT IDs:
- FHA Lender ID: 5222209998
- VA Lender ID: 9750740000

PRODUCTS: Conventional, FHA, VA, USDA, Non-QM, Jumbo, Renovation

NOTES:
- Full delegated and non-delegated correspondent options
- Competitive pricing on government loans
- Renovation lending (FHA 203k, HomeStyle)" --title "FCM TPO Correspondent Guide"
```

- [ ] **Step 5: Verify sources were added**

```bash
/Users/adamstyer/.local/bin/notebooklm source list --json
```

Expected: 4 new text sources visible in the list.

---

## Task 6: Add "Lenders" Nav Item to TopNav

**Files:**
- Modify: `src/components/TopNav.tsx:30-40`

- [ ] **Step 1: Add the Lenders nav item**

In `src/components/TopNav.tsx`, add `'lenders'` to the `Section` type and add the nav item to `NAV_ITEMS` array. Insert between Marketing and Drip:

```typescript
// Line 30 — update Section type:
type Section = 'dashboard' | 'pipeline' | 'contacts' | 'scenarios' | 'marketing' | 'lenders' | 'drip' | 'admin' | 'settings'
```

Add to `NAV_ITEMS` array (after Marketing, before Drip):

```typescript
{ label: 'Lenders',  section: 'lenders',  href: '/dashboard/lenders', icon: <Building2 className="size-4" /> },
```

Add `Building2` to the lucide-react import:

```typescript
import {
  LayoutDashboard,
  Workflow,
  Users,
  Calculator,
  Megaphone,
  Building2,
  Mail,
  Shield,
  Settings,
  Search,
  Menu,
} from 'lucide-react'
```

Add to `sectionFromPath`:

```typescript
if (pathname.startsWith('/dashboard/lenders')) return 'lenders'
```

- [ ] **Step 2: Verify build compiles**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
```

Expected: Build succeeds (lenders page doesn't exist yet — that's fine, nav link just won't resolve).

- [ ] **Step 3: Commit**

```bash
git add src/components/TopNav.tsx
git commit -m "feat: add Lenders nav item to TopNav"
```

---

## Task 7: Create Lender Filters Component

**Files:**
- Create: `src/components/lenders/LenderFilters.tsx`

- [ ] **Step 1: Create the filters component**

```tsx
'use client'

import { Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type Props = {
  searchQuery: string
  onSearchChange: (q: string) => void
  channelFilter: string | null
  onChannelChange: (ch: string | null) => void
  productFilter: string | null
  onProductChange: (p: string | null) => void
  allChannels: string[]
  allProducts: string[]
}

export default function LenderFilters({
  searchQuery,
  onSearchChange,
  channelFilter,
  onChannelChange,
  productFilter,
  onProductChange,
  allChannels,
  allProducts,
}: Props) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search lenders, products, contacts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Channel filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Channel:</span>
        <button
          onClick={() => onChannelChange(null)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors',
            !channelFilter
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          )}
        >
          All
        </button>
        {allChannels.map((ch) => (
          <button
            key={ch}
            onClick={() => onChannelChange(channelFilter === ch ? null : ch)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              channelFilter === ch
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            )}
          >
            {ch}
          </button>
        ))}
      </div>

      {/* Product filter */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">Products:</span>
        <button
          onClick={() => onProductChange(null)}
          className={cn(
            'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
            !productFilter
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          )}
        >
          All
        </button>
        {allProducts.map((p) => (
          <Badge
            key={p}
            variant={productFilter === p ? 'default' : 'secondary'}
            className={cn(
              'cursor-pointer text-xs',
              productFilter === p && 'bg-primary text-primary-foreground'
            )}
            onClick={() => onProductChange(productFilter === p ? null : p)}
          >
            {p}
          </Badge>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify the file was created**

```bash
cat src/components/lenders/LenderFilters.tsx | head -5
```

Expected: File exists with `'use client'` header.

---

## Task 8: Create LenderCard Component

**Files:**
- Create: `src/components/lenders/LenderCard.tsx`

- [ ] **Step 1: Create the lender card component**

```tsx
'use client'

import { useState } from 'react'
import { Building2, Phone, Mail, Globe, ChevronDown, ChevronUp, Hash, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Contact = {
  name: string
  phone?: string
  email?: string
  role?: string
}

export type Lender = {
  id: string
  name: string
  channel: string | null
  website: string | null
  broker_id: string | null
  contacts: Contact[]
  specialty_products: string[]
  notes: string | null
  updated_at: string
}

export default function LenderCard({ lender }: { lender: Lender }) {
  const [expanded, setExpanded] = useState(false)

  const channelColor = lender.channel === 'Broker Only'
    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30'
    : lender.channel === 'Correspondent'
      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
      : 'bg-muted text-muted-foreground border-border'

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary shrink-0">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{lender.name}</h3>
              {lender.channel && (
                <Badge variant="outline" className={cn('text-xs mt-1', channelColor)}>
                  {lender.channel}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {lender.website && (
              <a
                href={lender.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Globe className="size-3" />
                Portal
              </a>
            )}
            {lender.broker_id && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Hash className="size-3" />
                {lender.broker_id}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* AE Contacts */}
        {lender.contacts.length > 0 && (
          <div className="space-y-2">
            {lender.contacts.map((c, i) => (
              <div key={i} className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="size-3 text-muted-foreground shrink-0" />
                  <span className="font-medium text-foreground truncate">{c.name}</span>
                  {c.role && (
                    <span className="text-xs text-muted-foreground">({c.role})</span>
                  )}
                </div>
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <Phone className="size-3" />
                    {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <Mail className="size-3" />
                    {c.email}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Specialty Products */}
        {lender.specialty_products.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {lender.specialty_products.map((p) => (
              <Badge key={p} variant="secondary" className="text-xs">
                {p}
              </Badge>
            ))}
          </div>
        )}

        {/* Expandable Notes */}
        {lender.notes && (
          <div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              {expanded ? 'Hide details' : 'Show details'}
            </button>
            {expanded && (
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {lender.notes}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Verify the file was created**

```bash
cat src/components/lenders/LenderCard.tsx | head -5
```

Expected: File exists with `'use client'` header.

---

## Task 9: Create Lenders Client Component

**Files:**
- Create: `src/app/dashboard/lenders/LendersClient.tsx`

- [ ] **Step 1: Create the client component**

```tsx
'use client'

import { useMemo, useState } from 'react'
import LenderCard from '@/components/lenders/LenderCard'
import LenderFilters from '@/components/lenders/LenderFilters'
import type { Lender } from '@/components/lenders/LenderCard'

export default function LendersClient({ lenders }: { lenders: Lender[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [channelFilter, setChannelFilter] = useState<string | null>(null)
  const [productFilter, setProductFilter] = useState<string | null>(null)

  // Derive unique channels and products for filter pills
  const allChannels = useMemo(() => {
    const set = new Set<string>()
    lenders.forEach((l) => { if (l.channel) set.add(l.channel) })
    return Array.from(set).sort()
  }, [lenders])

  const allProducts = useMemo(() => {
    const counts = new Map<string, number>()
    lenders.forEach((l) => {
      l.specialty_products.forEach((p) => {
        counts.set(p, (counts.get(p) || 0) + 1)
      })
    })
    // Sort by frequency (most common first), then alphabetically
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([p]) => p)
  }, [lenders])

  // Filter lenders
  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return lenders.filter((l) => {
      // Channel filter
      if (channelFilter && l.channel !== channelFilter) return false
      // Product filter
      if (productFilter && !l.specialty_products.includes(productFilter)) return false
      // Search query — match name, contacts, products, notes
      if (q) {
        const nameMatch = l.name.toLowerCase().includes(q)
        const contactMatch = l.contacts.some(
          (c) => c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q)
        )
        const productMatch = l.specialty_products.some((p) => p.toLowerCase().includes(q))
        const notesMatch = l.notes?.toLowerCase().includes(q)
        if (!nameMatch && !contactMatch && !productMatch && !notesMatch) return false
      }
      return true
    })
  }, [lenders, searchQuery, channelFilter, productFilter])

  return (
    <div className="space-y-6">
      <LenderFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        channelFilter={channelFilter}
        onChannelChange={setChannelFilter}
        productFilter={productFilter}
        onProductChange={setProductFilter}
        allChannels={allChannels}
        allProducts={allProducts}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} of {lenders.length} lender{lenders.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-input p-12 text-center">
          <p className="text-muted-foreground">No lenders match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
            <LenderCard key={l.id} lender={l} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the file was created**

```bash
cat src/app/dashboard/lenders/LendersClient.tsx | head -5
```

Expected: File exists with `'use client'` header.

---

## Task 10: Create Lenders Server Page

**Files:**
- Create: `src/app/dashboard/lenders/page.tsx`

- [ ] **Step 1: Create the server page**

```tsx
import { createClient } from '@/lib/supabase/server'
import { getOrganization } from '@/lib/getOrganization'
import { redirect } from 'next/navigation'
import LendersClient from './LendersClient'

export const metadata = { title: 'Lenders | LoanOS' }

export default async function LendersPage() {
  const org = await getOrganization()
  if (!org) redirect('/login')

  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lenders } = await (supabase as any)
    .from('lenders')
    .select('id, name, channel, website, broker_id, contacts, specialty_products, notes, updated_at')
    .eq('organization_id', org.id)
    .order('name')

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Lender Resources</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Wholesale and correspondent lender contacts, products, and guidelines.
        </p>
      </div>
      <LendersClient lenders={lenders ?? []} />
    </div>
  )
}
```

- [ ] **Step 2: Run build to verify everything compiles**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
```

Expected: Build succeeds. The `/dashboard/lenders` page renders.

- [ ] **Step 3: Commit all dashboard files**

```bash
git add src/app/dashboard/lenders/ src/components/lenders/ src/components/TopNav.tsx
git commit -m "feat: add Lender Resources dashboard page with search, filter, and card layout"
```

---

## Task 11: Build n8n Lender Email Ingest Workflow

**Files:**
- External: n8n workflow (created via MCP)

This workflow monitors Outlook for lender AE emails, extracts guideline content with Claude, and feeds it into NotebookLM + optionally updates Supabase.

- [ ] **Step 1: Create the workflow via n8n MCP**

Use `mcp__350fe8a4__create_workflow_from_code` to create the workflow. The workflow has 7 nodes:

**Node layout:**
1. **Schedule Trigger** — Runs daily at 8:00 AM CT
2. **Outlook Search** — Searches for emails from known lender AE domains in last 24h
3. **Filter** — Only keeps emails with guideline/product keywords in subject or body
4. **Claude Extract** — Sends email body to Claude to extract structured lender info
5. **NotebookLM Add Source** — POSTs extracted text to NotebookLM bridge `/add-source`
6. **Supabase Update** — Updates lender notes/products if new products detected
7. **Activity Log** — Logs the ingest event to Supabase activity_log

```json
{
  "name": "LoanOS — Lender Email Ingest",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [{ "triggerAtHour": 8 }]
        }
      },
      "id": "schedule",
      "name": "Daily 8am CT",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300]
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "getAll",
        "returnAll": false,
        "limit": 50,
        "filters": {
          "receivedAfter": "={{ $now.minus(1, 'day').toISO() }}",
          "folderId": "inbox"
        },
        "options": {
          "fields": "subject,from,body,receivedDateTime"
        }
      },
      "id": "outlook",
      "name": "Outlook - Get Recent Emails",
      "type": "n8n-nodes-base.microsoftOutlook",
      "typeVersion": 2,
      "position": [470, 300],
      "credentials": {
        "microsoftOutlookOAuth2Api": {
          "id": "existing",
          "name": "Microsoft Outlook"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Filter for lender-related emails by domain or keywords\nconst lenderDomains = [\n  'deephavenmortgage.com', 'amerisbank.com', 'prmg.net', 'uwm.com',\n  'rcmretail.com', 'flagstar.com', 'pennymac.com', 'newrez.com',\n  'dimensionsmortgage.com', 'champstpo.com', 'fcmtpo.com',\n  'fairwaymc.com', 'loandepot.com', 'acralending.com'\n];\nconst keywords = [\n  'guideline', 'product', 'program', 'rate sheet', 'overlay',\n  'non-qm', 'dscr', 'heloc', 'bank statement', 'itin',\n  'fha', 'va', 'usda', 'jumbo', 'conventional', 'ltv', 'fico',\n  'underwriting', 'eligibility', 'matrix'\n];\n\nconst results = [];\nfor (const item of $input.all()) {\n  const from = (item.json.from?.emailAddress?.address || '').toLowerCase();\n  const subject = (item.json.subject || '').toLowerCase();\n  const body = (item.json.body?.content || '').toLowerCase();\n  \n  const domainMatch = lenderDomains.some(d => from.includes(d));\n  const keywordMatch = keywords.some(k => subject.includes(k) || body.includes(k));\n  \n  if (domainMatch && keywordMatch) {\n    results.push({\n      json: {\n        from: item.json.from?.emailAddress?.address,\n        fromName: item.json.from?.emailAddress?.name,\n        subject: item.json.subject,\n        body: item.json.body?.content?.replace(/<[^>]*>/g, ' ').replace(/\\s+/g, ' ').trim().substring(0, 8000),\n        receivedAt: item.json.receivedDateTime\n      }\n    });\n  }\n}\n\nreturn results.length > 0 ? results : [{ json: { _skip: true } }];"
      },
      "id": "filter",
      "name": "Filter Lender Emails",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [690, 300]
    },
    {
      "parameters": {
        "conditions": {
          "options": { "caseSensitive": false, "leftValue": "" },
          "conditions": [
            {
              "id": "skip-check",
              "leftValue": "={{ $json._skip }}",
              "rightValue": true,
              "operator": { "type": "boolean", "operation": "notEqual" }
            }
          ]
        }
      },
      "id": "if-skip",
      "name": "Has Emails?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 2.2,
      "position": [910, 300]
    },
    {
      "parameters": {
        "url": "https://api.anthropic.com/v1/messages",
        "authentication": "predefinedCredentialType",
        "nodeCredentialType": "httpHeaderAuth",
        "sendBody": true,
        "contentType": "raw",
        "rawContentType": "application/json",
        "body": "={{ JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 2000, messages: [{ role: 'user', content: 'Extract lender guideline information from this email. Return a structured summary with:\\n- Lender name\\n- Products mentioned (list each with key parameters like LTV, FICO, DTI limits)\\n- Any new guidelines, overlays, or changes\\n- Key dates or deadlines mentioned\\n\\nEmail from: ' + $json.fromName + ' (' + $json.from + ')\\nSubject: ' + $json.subject + '\\n\\nBody:\\n' + $json.body }] }) }}",
        "options": {
          "response": { "response": { "responseFormat": "json" } }
        },
        "headerParameters": {
          "parameters": [
            { "name": "anthropic-version", "value": "2023-06-01" },
            { "name": "content-type", "value": "application/json" }
          ]
        }
      },
      "id": "claude",
      "name": "Claude - Extract Guidelines",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1130, 200],
      "credentials": {
        "httpHeaderAuth": {
          "id": "SlNsEedAOCoo6NwH",
          "name": "Header Auth account 2"
        }
      }
    },
    {
      "parameters": {
        "method": "POST",
        "url": "http://localhost:8001/add-source",
        "sendBody": true,
        "contentType": "raw",
        "rawContentType": "application/json",
        "body": "={{ JSON.stringify({ text: 'Lender Email Ingest — ' + $('Filter Lender Emails').item.json.subject + '\\n\\nFrom: ' + $('Filter Lender Emails').item.json.fromName + '\\nDate: ' + $('Filter Lender Emails').item.json.receivedAt + '\\n\\n' + $json.content[0].text, title: 'Email: ' + $('Filter Lender Emails').item.json.subject }) }}",
        "options": {}
      },
      "id": "notebook",
      "name": "NotebookLM - Add Source",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1350, 200]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/activity_log",
        "sendBody": true,
        "contentType": "raw",
        "rawContentType": "application/json",
        "body": "={{ JSON.stringify({ organization_id: '18613f82-fdd9-42dd-a09e-f3c577328258', event_type: 'lender_email_ingest', description: 'Auto-ingested lender email: ' + $('Filter Lender Emails').item.json.subject, metadata: { from: $('Filter Lender Emails').item.json.from, subject: $('Filter Lender Emails').item.json.subject }, created_at: new Date().toISOString() }) }}",
        "options": {},
        "headerParameters": {
          "parameters": [
            { "name": "apikey", "value": "={{ $env.SUPABASE_SERVICE_KEY }}" },
            { "name": "Authorization", "value": "=Bearer {{ $env.SUPABASE_SERVICE_KEY }}" },
            { "name": "Content-Type", "value": "application/json" },
            { "name": "Prefer", "value": "return=minimal" }
          ]
        }
      },
      "id": "log",
      "name": "Log to Activity",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [1570, 200]
    }
  ],
  "connections": {
    "Daily 8am CT": { "main": [[{ "node": "Outlook - Get Recent Emails", "type": "main", "index": 0 }]] },
    "Outlook - Get Recent Emails": { "main": [[{ "node": "Filter Lender Emails", "type": "main", "index": 0 }]] },
    "Filter Lender Emails": { "main": [[{ "node": "Has Emails?", "type": "main", "index": 0 }]] },
    "Has Emails?": { "main": [[{ "node": "Claude - Extract Guidelines", "type": "main", "index": 0 }], []] },
    "Claude - Extract Guidelines": { "main": [[{ "node": "NotebookLM - Add Source", "type": "main", "index": 0 }]] },
    "NotebookLM - Add Source": { "main": [[{ "node": "Log to Activity", "type": "main", "index": 0 }]] }
  },
  "settings": { "executionOrder": "v1" }
}
```

- [ ] **Step 2: Verify the workflow was created**

Use `mcp__350fe8a4__search_workflows` to find "Lender Email Ingest" and confirm it exists.

- [ ] **Step 3: Activate the workflow**

Use `mcp__350fe8a4__publish_workflow` to set the workflow to active.

---

## Task 12: End-of-Session — Build, Commit, Push, Deploy

**Files:**
- Modify: `CONTEXT.md`, `CHANGELOG.md`

- [ ] **Step 1: Run build**

```bash
cd /Users/adamstyer/Documents/loanos-clone && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Update CONTEXT.md**

Add a new section at the top of the "Current Status" area documenting:
- Lender Knowledge System built
- Supabase: Deephaven updated, Ameris updated, Champions Funding added, FCM TPO added
- NotebookLM: 4 new text sources added (Deephaven, Ameris, Champions, FCM)
- Dashboard: `/dashboard/lenders` page with search, filter by channel/product, card layout
- n8n: "LoanOS — Lender Email Ingest" workflow created (daily 8am, Outlook → Claude → NotebookLM → activity log)
- TopNav: Lenders item added between Marketing and Drip

- [ ] **Step 3: Update CHANGELOG.md**

Add entry for this session.

- [ ] **Step 4: Commit all changes**

```bash
git add -A
git commit -m "feat: Lender Knowledge System — dashboard page, data updates, NotebookLM sources, n8n auto-ingest"
```

- [ ] **Step 5: Push to remote**

```bash
git push origin main
```

- [ ] **Step 6: Verify Vercel deployment**

Use `mcp__ffdaa602__list_deployments` to check deployment status. Wait for `state: READY`.

If `state: ERROR`, read build logs with `mcp__ffdaa602__get_deployment_build_logs`, fix the issue, rebuild, and push again.
