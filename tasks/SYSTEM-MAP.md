# LoanOS Agent System Map
Last updated: 2026-03-25

---

## HOW TO USE THIS FILE

Each row is one scheduled task. To add a new agent system:
1. Add a row here
2. Run `bash setup-agent.sh [slug] [am_hour] [pm_hour]` or use the MCP task creator
3. Copy the master template and fill in [CONFIGURE] placeholders

---

## ACTIVE AGENT SYSTEMS

### Overnight / Early Morning (autonomous — runs while you sleep)

| Task ID | What It Does | Schedule | Notebook | Week Goal | Status |
|---------|-------------|----------|----------|-----------|--------|
| `social-media-am` | Researches content, writes LinkedIn/Instagram/Facebook posts, reviews for compliance | 2 AM daily | LoanOS Social Media (new) | 5 posts/week zero manual input | ✅ Week 1 |
| `lead-gen-am` | Builds landing pages, Mailchimp sequences, Zapier/n8n funnels | 3 AM daily | LoanOS Lead Gen Intelligence (new) | 20 qualified leads/month from owned channels | ✅ Week 1 |
| `seo-sem-am` | Keyword research, meta tags, blog posts, on-page SEO for styermortgage.com | 4 AM daily | SEO SEM & Lead Gen 2026 (existing) | Rank #1 "mortgage broker Austin TX" + 10 keywords | ✅ Week 1 |

### Morning (runs before business hours)

| Task ID | What It Does | Schedule | Notebook | Goal | Status |
|---------|-------------|----------|----------|------|--------|
| `loanos-enterprise-am` | Master orchestrator for LoanOS app — research, architecture, execution across all LoanOS features | 7 AM daily | LoanOS Enterprise (existing) | Full AI-powered mortgage business OS | ✅ Active |
| `styer-site-daily` | styermortgage.com conversion optimization — CTAs, landing pages, funnel health, A/B ideas | 7 AM daily | LoanOS Website Intelligence (existing) | 5%+ visitor-to-lead conversion | ✅ Active |
| `loanos-daily` | LoanOS codebase health — build checks, TypeScript errors, code quality, one fix per run | 8 AM daily | — | Zero build errors, clean code | ✅ Active |
| `loanos-crm-am` | Salesforce → LoanOS Supabase CRM migration — data audit, field mapping, automation rebuild | 8 AM daily | LoanOS CRM Intelligence (existing) | Full Jungo replacement by Week 8 | ✅ Week 1 |

### Weekly

| Task ID | What It Does | Schedule | Notebook | Goal | Status |
|---------|-------------|----------|----------|------|--------|
| `styer-content-weekly` | Full SEO blog post — research, write, Reviewer compliance check, deploy | 9 AM Fridays | — | 1 published post/week | ✅ Active |
| `competitive-intel-daily` | Competitor SERP rankings, ad landscape, Austin mortgage keyword gaps | 5 AM Mondays | SEO SEM & Lead Gen 2026 (existing) | Weekly competitive intelligence report | ✅ Active |
| `loanos-knowledge-base` | LoanOS design + CRM audit — implements fixes, pushes, updates NotebookLM | 7 AM Sundays | LoanOS Enterprise (existing) | Running improvement loop | ✅ Active |
| `gbp-optimization` | Google Business Profile optimization + local SEO | 9 AM Sundays | — | Local pack ranking for Austin mortgage | ✅ Active |

### Evening (PM counterparts — push/curate NotebookLM + daily digest email)

| Task ID | What It Does | Schedule | Status |
|---------|-------------|----------|--------|
| `social-media-pm` | NotebookLM PUSH+CURATE + daily digest to adam@thestyerteam.com | 9 PM daily | ✅ Active |
| `lead-gen-pm` | NotebookLM PUSH+CURATE + daily digest | 10 PM daily | ✅ Active |
| `seo-sem-pm` | NotebookLM PUSH+CURATE + daily digest | 11 PM daily | ✅ Active |
| `loanos-enterprise-pm` | NotebookLM PUSH+CURATE + daily digest | 6 PM daily | ✅ Active |
| `loanos-crm-pm` | NotebookLM PUSH+CURATE + daily digest | 5 PM daily | ✅ Active |

### Infrastructure

| Task ID | What It Does | Schedule | Status |
|---------|-------------|----------|--------|
| `loanos-build-watchdog` | Hourly build health check for LoanOS | Every hour | ✅ Active |

---

## MANUAL / AD-HOC TASKS (no schedule — trigger manually)

| Task ID | What It Does | How to Trigger |
|---------|-------------|----------------|
| `styer-site-cowork` | Interactive co-working on styermortgage.com — propose → wait for approval → implement | Run Now in sidebar |
| `loanos-aesthetics` | LoanOS UI design session — requires Adam present | Run Now in sidebar |

---

## DOMAIN COVERAGE MAP

```
MORTGAGE BUSINESS
├── Pipeline / Operations
│   ├── loanos-enterprise-am/pm     ← LoanOS app features, architecture
│   ├── loanos-daily                ← Code health
│   ├── loanos-knowledge-base       ← Weekly deep fixes
│   ├── loanos-build-watchdog       ← Uptime
│   └── loanos-crm-am/pm            ← Salesforce → Supabase migration
│
├── Website (styermortgage.com)
│   ├── styer-site-daily            ← Conversion optimization
│   ├── styer-site-cowork           ← Manual design sessions
│   ├── seo-sem-am/pm               ← SEO, keywords, on-page
│   ├── styer-content-weekly        ← Weekly blog post
│   └── competitive-intel-daily     ← Monday competitor research
│
├── Lead Generation
│   ├── lead-gen-am/pm              ← Funnels, landing pages, email sequences
│   └── gbp-optimization            ← Google Business Profile
│
└── Marketing & Brand
    └── social-media-am/pm          ← LinkedIn, Instagram, Facebook content
```

---

## GAPS — AREAS WITH NO AGENT COVERAGE YET

| Area | What's Missing | Priority | Notes |
|------|---------------|----------|-------|
| **Email Marketing** | Mailchimp list health, unsubscribe rates, campaign performance, A/B testing | HIGH | Lead-gen covers building sequences; nobody monitors ongoing list performance |
| **Referral Partner System** | Realtor relationship tracking, co-marketing materials, monthly value reports | HIGH | Mentioned in CRM Week 5-6 but no dedicated agent |
| **Rate Alerts / Market Updates** | Automated rate update emails when market moves, Mailchimp broadcast trigger | HIGH | Weekly rate email currently manual |
| **Review Generation** | Post-close review request automation, Google review monitoring | MEDIUM | n8n workflow exists (inactive) |
| **Paid Advertising** | Google Ads monitoring, Facebook/Instagram ad spend, lead ad performance | MEDIUM | SEM is Week 8 of SEO queue — not dedicated |
| **Video / Reels Production** | Script writing, recording prompts, repurposing content to video | MEDIUM | Social media covers scripting but no production agent |
| **Borrower Experience** | Application status communications, milestone updates, docs reminder sequences | MEDIUM | n8n workflows exist but not agent-managed |
| **Analytics Reporting** | Weekly roll-up of all channel performance — leads, traffic, rankings, social | LOW | Each domain produces its own digest; no consolidated view |
| **Podcast / Long-form Content** | Episode planning, guest outreach, show notes | LOW | |

---

## HOW TO ADD A NEW AGENT SYSTEM

1. Add a row in the GAPS table above when you identify a need
2. When ready to build: copy the master template folder structure from `tasks/enterprise/`
3. Run: `cd /Users/adamstyer/Documents/loanos-clone && bash setup-agent.sh [slug] [am_hour] [pm_hour]`
4. Fill in all `[CONFIGURE]` placeholders in the 9 files
5. Create MCP tasks via the Scheduled Tasks sidebar or ask Claude to create them
6. Update this file

**Template location:** `/Users/adamstyer/Downloads/master-agent-template/`

---

## NOTEBOOKLM NOTEBOOKS

| Notebook | ID | Used By |
|----------|----|---------|
| LoanOS Enterprise | `284383e3-c395-45de-bc63-d2052809b359` | loanos-enterprise-am/pm, loanos-knowledge-base |
| LoanOS CRM Intelligence | `7b40d6c2-5bed-4151-b25c-1c9e6d8ded6b` | loanos-crm-am/pm |
| LoanOS Website Intelligence | `134ce291-2e75-42f0-b291-a91b4a793c34` | styer-site-daily |
| SEO SEM & Lead Gen 2026 | `7f8a80c5-3ffd-442e-880a-f748365a792b` | seo-sem-am/pm, competitive-intel-daily |
| LoanOS Social Media | (created on first run) | social-media-am/pm |
| LoanOS Lead Gen Intelligence | (created on first run) | lead-gen-am/pm |
