# LoanOS Support Stack Recommendation

**Date:** 2026-04-05
**Author:** Claude (research pass)
**Context:** Solo founder launch, 2026-04-26. Target: 20-50 tenants in 90 days. Tiers $97/$197. Next.js 14 + Supabase + Vercel.

---

## 1. Help Desk / Ticketing Comparison

Pricing assumes 1 seat (Adam) at 20-50 tenant scale.

| Tool | ~Monthly Cost (1 seat) | AI / Automation | Next.js Embed Effort | Email-to-Ticket | Fit (1-10) |
|---|---|---|---|---|---|
| **Intercom** | $39 Essential + $0.99/resolution Fin AI (~$75-150 all-in) | Best-in-class — Fin AI resolves ~40% of tickets with your KB | Easy — `<script>` snippet, official Next.js docs | Yes | 7 — powerful but expensive and overkill for 20-50 tenants |
| **Crisp** | $45/mo Pro (unlimited seats, MagicReply AI) | Solid — MagicReply, AI draft, bot builder | Very easy — `<script>` + `window.$crisp` | Yes | **9** — cheap, fast, AI included, works for solo founders |
| **Plain** | $0 for 1 seat (Starter); $79/seat Growth | Developer-first, no built-in AI bot | Requires API/SDK work — no drop-in widget | Yes | 5 — beautiful but built for engineering teams, not mortgage brokers |
| **HelpScout** | $55/seat Standard (Beacon included) | Decent — AI Answers, AI Assist (draft/summarize) | Easy — Beacon script | Yes (native mailbox) | 8 — email-first, clean, but AI is weaker than Crisp/Intercom |
| **Front** | $59/seat Growth | Good — Front AI, rules engine | Medium — chat widget is newer, less polished | Yes (shared inbox native) | 6 — strong for teams, wasted on solo |
| **Chatwoot (self-host)** | ~$15-25/mo infra (Supabase/Fly) + time | Basic — Captain AI addon extra | Medium — widget script, self-hosted auth pain | Yes | 4 — "free" becomes expensive in time; skip at launch |

**Winner: Crisp.** Unlimited seats on one $45 plan, MagicReply AI, drop-in widget, Shopify-tier polish. Intercom is better but 2-3x the cost with Fin consumption pricing that punishes you as volume grows.

---

## 2. In-App Chat Widget — Lowest Lift in Next.js 14 App Router

**Crisp is the lowest lift.** Single script tag, identifies the logged-in broker automatically, conversations follow them across sessions.

Create `components/CrispChat.tsx`:

```tsx
"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    $crisp: any[];
    CRISP_WEBSITE_ID: string;
    CRISP_TOKEN_ID?: string;
  }
}

export default function CrispChat({
  user,
}: {
  user?: { id: string; email: string; name?: string; tier?: string; tenant?: string };
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.$crisp = window.$crisp || [];
    window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID!;
    if (user) {
      window.CRISP_TOKEN_ID = user.id;
      window.$crisp.push(["set", "user:email", user.email]);
      if (user.name) window.$crisp.push(["set", "user:nickname", [user.name]]);
      window.$crisp.push([
        "set",
        "session:data",
        [[["tier", user.tier ?? "unknown"], ["tenant", user.tenant ?? ""]]],
      ]);
    }
  }, [user]);

  return (
    <Script
      id="crisp-widget"
      strategy="afterInteractive"
      src="https://client.crisp.chat/l.js"
    />
  );
}
```

Mount it in `app/(app)/layout.tsx` where the Supabase session is already available server-side — pass `user` as a prop so Crisp gets tier + tenant as segments for routing and triage. Total install time: ~15 minutes.

---

## 3. Knowledge Base / Help Center

**Use Crisp's built-in Helpdesk** (free with the $45 plan). It indexes articles into MagicReply AI automatically, so every article makes the bot smarter. Custom subdomain (help.loanos.app), clean public UI, full-text search, category routing. Zero additional cost, zero additional tool to maintain.

### First 20 Help Articles (titles only)

**Getting Started (5)**
1. Welcome to LoanOS — Your First 15 Minutes
2. Connecting Your Arive Account (OAuth Walkthrough)
3. Importing Your Existing Pipeline from Arive or Encompass
4. Inviting Your Processor and Assistant
5. Basic vs. Full Plan — What's Included on Each Tier

**CRM (4)**
6. Adding Borrowers, Realtors, and Referral Partners
7. Tags, Groups, and Pipeline Stages Explained
8. Setting Up Drip Campaigns and Milestone Emails
9. Logging Calls, Texts, and Emails Automatically

**Loan Scenarios (4)**
10. Running a Quick Scenario (Purchase, Refi, Cash-Out)
11. Generating a Pre-Approval Letter in Under 60 Seconds
12. Total Cost Analysis — Comparing Multiple Options
13. Sharing a Scenario with a Borrower or Realtor

**Billing (3)**
14. Managing Your Subscription and Payment Method
15. Upgrading from Basic to Full (and Downgrading)
16. Invoices, Receipts, and Failed Payments

**Troubleshooting (4)**
17. Arive Sync Isn't Showing New Loans — What to Check
18. Login and Password Reset Issues
19. Emails Not Sending or Landing in Spam
20. "Something Went Wrong" — How to Report a Bug Fast

---

## 4. Status Page

| Tool | Monthly Cost | Vercel Integration | Notes |
|---|---|---|---|
| **Instatus** | $0 Free tier (public page, 2 components) or $20 Starter | No native Vercel integration, but webhook-friendly | Fastest setup, best-looking free tier, markdown incidents |
| **BetterStack (Better Uptime)** | $29/mo Freelancer | **Yes** — native Vercel deploy webhook + uptime monitors + logs + on-call SMS | Monitoring + status page + incident on-call in one |
| **Statuspage.io (Atlassian)** | $29/mo Starter (3 users) | No native Vercel — webhook only | Enterprise feel, overkill for solo founder |

**Winner: BetterStack at $29/mo.** It's the only one that combines uptime checks, status page, and on-call SMS in a single bill. Point it at `loanos.app/api/health`, wire Vercel deploy webhooks in, done. Instatus is cheaper but you still need monitoring somewhere — just pay once.

---

## 5. Escalation & Routing for Solo Founder

Adam cannot be on live chat while originating loans. The system must absorb 80% of support without him.

### Tier 1 — AI / Bot Auto-Response (0 min, 24/7)
Crisp MagicReply + KB trained on the 20 articles above. Auto-resolves:
- Password reset, login, MFA issues
- "How do I…" questions (CRM basics, running scenarios, inviting users)
- Billing questions (invoice download, update card, upgrade tier)
- Arive sync status and reconnect flow
- Feature location ("where is X button?")

Also: Crisp triggers (rules) that auto-reply in <10 seconds with canned answers for the top 10 keywords (`arive`, `sync`, `invoice`, `password`, `pre-approval`, `scenario`, `import`, `drip`, `realtor`, `refund`).

### Tier 2 — Async Email (Adam, during business hours)
Everything else flows into a Crisp conversation → mirrored to Outlook via n8n webhook → logged to Supabase `support_tickets` table. Adam works it in batches 2x/day (10am, 4pm).

**SLA published publicly:**
- Basic tier ($97): 1 business day first response
- Full tier ($197): 4 business hours first response, same-day resolution target
- Weekends: best-effort, AI bot only

Auto-acknowledgement fires instantly with ticket number, expected response window, and link to KB.

### Tier 3 — Live / Phone (rare, gated)
Only for:
1. **Closing-day emergencies** — borrower at title company, system blocking a CD or PA letter. Trigger phrase in chat ("closing today", "at title") escalates to SMS to Adam via n8n + Twilio or iMessage MCP.
2. **Full tier onboarding calls** — one 30-min Calendly slot offered in the welcome email, never after.
3. **Churn risk** — if NPS < 6 or cancel button clicked, auto-offer a call via Calendly link.

Phone number is **not published**. Calendly link is only shared inside Tier 3 flows, never on the marketing site.

### Existing Tool Integration
- **n8n**: new Crisp conversation → webhook → Supabase log → Outlook draft if unassigned > 2h → SMS Adam if "closing today" keyword
- **Supabase**: `support_tickets` table mirrors Crisp for reporting; `support_metrics` view tracks first-response time
- **Outlook**: secondary inbox `support@loanos.app` forwards into Crisp (email-to-ticket); Adam never reads it directly

---

## 6. Recommended Stack

| Layer | Tool | Monthly |
|---|---|---|
| Help desk + chat widget + KB | **Crisp Pro** (unlimited seats, MagicReply AI, Helpdesk) | $45 |
| Status page + uptime + on-call | **BetterStack Freelancer** | $29 |
| Escalation SMS (closing emergencies) | **Twilio pay-as-you-go** (~$1 + $0.0079/SMS) | ~$5 |
| Email-to-ticket forwarding | Outlook (already owned) + n8n (already running) | $0 |
| Ticket mirroring / metrics | Supabase (already owned) | $0 |
| **Total** | | **~$79/mo** |

One login for chat + KB + bot, one login for status + uptime, and it all plugs into the n8n/Supabase spine you already run. Under $80/mo means 1 Full-tier customer covers the entire support stack.

---

## 7. One-Week Implementation Checklist (launch 2026-04-26)

**Day 1 — Mon 2026-04-13: Provision**
- Create Crisp workspace, configure brand (logo, colors, welcome message)
- Create BetterStack account, add `loanos.app` monitor + `/api/health` endpoint
- Buy Twilio number, store SID/auth token in Vercel env + n8n credentials
- Add `NEXT_PUBLIC_CRISP_WEBSITE_ID` to Vercel env (prod + preview)

**Day 2 — Tue 2026-04-14: Embed + health check**
- Build `components/CrispChat.tsx` (code in §2), mount in `app/(app)/layout.tsx`
- Pass Supabase user (id, email, name, tier, tenant) into widget
- Add `app/api/health/route.ts` returning DB + Arive ping status
- Wire BetterStack monitor, test down/up alerts to Adam's phone

**Day 3 — Wed 2026-04-15: Knowledge base content**
- Write the 20 KB articles in Crisp Helpdesk (Claude drafts, Adam edits in 2 passes)
- Publish under `help.loanos.app` custom subdomain
- Enable MagicReply AI, train on the 20 articles

**Day 4 — Thu 2026-04-16: Automations + routing**
- Build n8n workflow: Crisp webhook → Supabase `support_tickets` log → Outlook mirror
- Add Crisp triggers: auto-reply for top 10 keywords, "closing today" escalation → Twilio SMS to Adam
- Create Supabase `support_tickets` table + `support_metrics` view
- Set business hours in Crisp, configure away messages + SLA copy

**Day 5 — Fri 2026-04-17: Status page + billing flows**
- Publish BetterStack status page at `status.loanos.app`
- Link status page in LoanOS footer + Crisp widget footer
- Add Vercel deploy webhook → BetterStack incident auto-post for rollbacks
- Write billing KB articles (Stripe portal links, upgrade/downgrade, refunds)

**Day 6 — Sat 2026-04-18: End-to-end test**
- Full rehearsal: file a ticket from a test tenant, verify Crisp → Supabase → Outlook → SMS escalation
- Test "closing today" keyword path end-to-end
- Load-test MagicReply with 20 common broker questions, tune responses
- Publish SLA page on marketing site + inside app

**Day 7 — Sun 2026-04-19: Soft launch to beta**
- Invite 3-5 beta brokers, point them at chat + KB
- Monitor Crisp inbox live for 2 hours, tune auto-replies based on real language
- Review first-response metrics, adjust triggers
- Lock stack for 2026-04-26 general launch

---

## TL;DR
Crisp Pro + BetterStack Freelancer + Twilio SMS. ~$79/mo. Crisp handles chat, KB, bot, and email-to-ticket in one bill; BetterStack handles status + uptime + on-call; n8n and Supabase are the glue Adam already owns. Tier 1 bot, Tier 2 async email with published SLAs, Tier 3 SMS only for closing-day emergencies and Full-tier onboarding. Stand it up in 7 days before 2026-04-26 launch.
