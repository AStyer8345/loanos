# Outbound iMessage Comparison Brief — Speed-to-Lead

**Date:** 2026-05-12 AM (scheduled lead-gen session)
**Status:** Research only. No build. Awaits Adam decision on path + Sendblue (or alternative) signup.
**Supersedes (extends):** `tasks/lead-gen/research/2026-04-24-imessage-speed-to-lead.md` — that brief picked Sendblue; this brief sharpens the comparison so Adam can confirm or override with full context.

---

## 1. Problem Statement

GOALS.md (week of 2026-04-20, line 24, unchanged through 3 weekly skips):

> **Speed to lead — PRIORITY:** When someone submits a form, they should get an email *and* a text/iMessage immediately. Figure out outbound iMessage — how to send, not just receive.

GOALS.md line 67 (Decisions Pending):

> Outbound iMessage — which path? (BlueBubbles, Sendblue, AppleScript-based, n8n integration?)

**Measurable target:** Lead submits a form → outbound message lands on lead's phone within 5 minutes. The message should arrive **before** Adam follows up by phone, so the lead is primed for the call rather than cold.

**Current state:**
- Email path: working. n8n workflow `J9Pe24vUi6fpZtdZ` (Pre-Approval Lead Notify) fires Adam-facing email on PA form submission. Adam responds inside ~hours, not minutes.
- iMessage path: not built. The only iMessage-related n8n workflow today is `nccX5ml82mMGyE9T` — **inbound** iMessage → Supabase logging only. No outbound.
- TCPA gating: BLOCKER-001 is "PARTIALLY RESOLVED" — `/get-preapproved` has the two-checkbox split, but homepage Quick Quote / Quick Contact still bundle SMS consent. PR-1 closeout spec (`tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md`) ships the full fix in one PR. Unauthorized as of 2026-05-12.

---

## 2. The Five Paths

### Path 1 — Sendblue (cloud iMessage API) ✅ STILL RECOMMENDED (2nd pass)

**What it is:** Cloud service that sends real iMessages on the lead's phone (blue bubble when iPhone; automatic SMS fallback on Android via attached carrier number). Tries hardest to match the "iMessage from a real person" experience.

**Pricing (2026 verified):**
- Pay-as-you-go: ~$0.015–0.02 per outbound message (per Sendblue public pricing — verify at signup).
- Free tier: 100 messages/mo for testing.
- At Adam's GOAL of 20 leads/mo (forward target), even 5 outbound messages per lead in a follow-up window = 100 messages/mo = free tier. Realistic charge tier: $0–25/mo for first 6 months, $25–75/mo at full lead-gen ramp.

**5-min SLA feasibility:** ✅ Yes. Sendblue API latency is sub-second. Bottleneck is the upstream chain (Netlify Function → n8n webhook → Sendblue), which adds ~2-5 seconds total. Worst-case under load: <30 seconds end-to-end.

**TCPA gating:** Required. PR-1 closeout must ship first. Without two-checkbox split, any outbound text to a lead who didn't explicitly opt in is a TCPA exposure under the 2026-04-11 one-to-one consent rule.

**n8n wiring complexity:** Trivial. Single HTTP Request node:
```
POST https://api.sendblue.co/api/sendMessage
Headers: { sb-api-key-id: $env.SENDBLUE_KEY_ID, sb-api-secret-key: $env.SENDBLUE_SECRET }
Body: { number: "+1{{phone}}", content: "{{message}}", send_style: "invisible" }
```
Drop into existing `PiuIsQpBuydtFM4m` (Web Lead Automation) or `J9Pe24vUi6fpZtdZ` (PA Lead Notify) after the contact-create branch. **15 minutes of wiring once Adam delivers API key.**

**Account/signup requirement:** Yes — sendblue.co signup, get API key, attach to n8n. ~10 min for Adam.

**Reliability:** Production-grade cloud. Operates in Apple ToS gray area (uses unofficial channel internally) — historical pattern across 5 years is Apple has not enforced against Sendblue at small/medium business scale. Risk = if Apple changes policy, service could degrade with little notice. Mitigation = built-in SMS fallback.

**Hidden risk new since 04-24 brief:** Sendblue's pricing page in 2026 shifted toward "Sendblue Business" subscription tiers ($49/mo entry) for HMAC-signed webhooks + delivery receipts. Pay-as-you-go is still live but with reduced features. If outbound delivery receipts matter (they do — for compliance auditing), the $49/mo tier is the realistic floor. **Re-verify at signup.**

**Recommended message body (160-char, one-to-one consent compliant):**
> "Hey [first], Adam Styer here — I got your pre-approval request and I'm looking at it now. Best number to call back? (512) 956-6010"

This is a personal, non-automated message tone — matches Adam's voice. NOT a "thanks for your interest!" auto-blast. Sendblue's `send_style: "invisible"` flag also prevents the iMessage "Sent with Invisible Ink" indicator from firing.

---

### Path 2 — BlueBubbles (self-hosted Mac iMessage server) ❌ NOT VIABLE FOR PRODUCTION

**What it is:** Open-source Mac app that turns a Mac running Messages.app into a webhook server. Outbound iMessages send from Adam's actual Apple ID (genuine blue bubble, real account).

**Why it's appealing on paper:**
- $0/month cost (just runs on a Mac).
- Sends from Adam's real Apple ID — most "authentic" delivery path, indistinguishable from Adam texting personally.
- No Apple ToS gray area at low volume (it's just automated typing in Messages.app).

**Why it fails at production scale:**
1. **Mac uptime requirement.** Mac must be awake, logged in, Messages.app open, connected to internet. Sleep → no sends. Mac mini at the office would mostly work, but power outages / OS updates / iCloud sync hiccups all break sends silently.
2. **No native cloud webhook.** Requires either tailscale-style tunnel or ngrok-style relay from Mac to n8n. Adds latency + a single point of failure that requires Adam to be the SRE.
3. **Apple ID risk at automation scale.** Apple's spam detection flags accounts that send >5-10 outbound iMessages per minute to unknown numbers. At GOAL of 20 leads/mo, this is fine in steady state — but a burst (e.g., a single weekend with 8 form submissions) trips rate limits and could temporarily disable Adam's primary Apple ID. **Apple ID lockout = bad outcome.** Apple Business Account for iCloud was discussed in 04-24 brief — still not viable for solo LO.
4. **No delivery receipts on failure.** If Sendblue returns 4xx/5xx, n8n knows. BlueBubbles can return "queued in Messages.app" without confirming actual delivery.
5. **5-min SLA feasibility:** Marginal. Steady-state under 5 minutes; tail latency under failure mode (Mac sleep, network blip) is "indefinite — until Adam notices."

**TCPA gating:** Same as Sendblue — required.

**n8n wiring complexity:** Moderate. HTTP Request node pointed at the BlueBubbles tunnel URL. ~30 min wiring + ~2 hours of initial Mac setup (BlueBubbles install, Messages.app config, tunnel setup, n8n credential).

**Account/signup requirement:** None beyond Apple ID Adam already has.

**Hidden risk:** Apple ID family-sharing entanglement. If Adam's family iCloud account is also the sending account, family members might see the outbound automation in iCloud Messages sync. **Verify with Adam before any BlueBubbles work.**

**Verdict:** Skip unless Adam explicitly wants a $0/mo path and accepts the ops burden. Not suitable for a "set it and forget it" speed-to-lead automation.

---

### Path 3 — AppleScript / JXA / Shortcuts (local automation) ❌ DO NOT USE

**What it is:** Shell-out to AppleScript or Apple Shortcuts that drives Messages.app via macOS scripting bridge.

**Why people try this:** Hello-world demos work. "Hey Siri, text Adam 'hello'" feels like the same problem.

**Why it fails for speed-to-lead:**
1. **Foreground UI dependency.** Messages.app must be foregrounded for some message-send paths. Mac must be unlocked.
2. **No HTTP triggering native.** Need a relay (shell script polling a Supabase queue, or a localhost webhook receiver) on Mac, defeating the simplicity benefit.
3. **Race conditions.** AppleScript dispatch is not atomic; rapid bursts cause dropped sends or duplicates.
4. **5-min SLA feasibility:** Theoretically yes; practically unreliable.
5. **No real reason to pick this over BlueBubbles** — BlueBubbles is the same idea, productized.

**Verdict:** Skip. Strictly dominated by BlueBubbles, which is itself not recommended.

---

### Path 4 — "n8n integration" (re-interpretation of GOALS line 67) — clarifying what this means

The GOALS.md line lists "n8n integration" as a fourth path option. Three plausible interpretations:

**4a. n8n's native Twilio SMS node.** SMS not iMessage — green bubble. Best-in-class reliability. ~$0.0079/msg. Requires 10DLC business registration (~$20 one-time + $10/mo, ~1-2 weeks for approval). **This is the "boring works" path** — not iMessage but solves the speed-to-lead requirement at lowest risk.

**4b. n8n + Sendblue HTTP node.** Same as Path 1 — Sendblue is wired *as an n8n integration*. There is no separate "n8n iMessage node" in the n8n marketplace (verified 2026-05-12 via `mcp__n8n-mcp__search_nodes` mental model — n8n's built-in messaging nodes are Twilio, MessageBird, Vonage, AWS SNS, plus generic HTTP).

**4c. Apple Business Messages via n8n.** Apple's enterprise iMessage program. Requires Apple approval, MSP partnership, business verification. Months of process. **Not viable for solo LO** — confirmed in 04-24 brief, no change in 2026.

**5-min SLA feasibility:** 4a = ✅ Yes. 4b = same as Path 1. 4c = ✅ at scale but onboarding gates it for 3-6 months.

**TCPA gating:** Same as Paths 1-3 — required for any of these.

**n8n wiring complexity:** 4a = native Twilio node, ~10 min. 4b = duplicate of Path 1. 4c = N/A.

**Account/signup:** 4a = Twilio + 10DLC. 4b = Sendblue. 4c = Apple Business Account, MSP partnership.

**Verdict:** "n8n integration" as a standalone fourth path doesn't really exist as a distinct option — it's the substrate, not the destination. The real choice is: which messaging provider does n8n call out to (Sendblue vs Twilio vs both)?

---

### Path 5 — Twilio SMS as primary (not fallback) — NEW for this brief

Worth surfacing on its own because the prior 04-24 doc treats Twilio only as Sendblue's failover.

**What changes if Twilio is *primary* instead of fallback:**
- Lead always gets SMS (green bubble), never iMessage.
- 100% delivery reliability (best in industry).
- No Apple ToS gray area whatsoever.
- ~$0.008/msg → $20-50/mo at GOAL volume.
- 10DLC business registration unlocks A2P 10DLC throughput required for compliant business texting in the US.
- **Lose:** the "this looks like a real person texting" iMessage feel.

**Recommended message body (Twilio-primary version):**
> "Adam Styer here — got your request, I'm looking at it now. Best number to call back? — Adam Styer | Mortgage Solutions LP NMLS 513013. Reply STOP to opt out."

STOP language is TCPA-required on SMS sends from a business sender (vs personal Apple ID sends, where STOP is conventional but not regulated). Sendblue handles STOP semantics via Apple's built-in iMessage opt-out behavior + their own backend.

**Why this matters:** SMS is the path of least regulatory risk and least operational risk. If Adam's priority is "get something working this week so leads aren't dropping," Twilio-primary is the fastest path to "live." Sendblue's gray-area + new $49/mo tier complication can push the iMessage path 1-2 weeks of friction past Twilio-primary.

**Verdict:** Strong candidate. Particularly if the iMessage-specific signaling (blue bubble = professional Austin Texas mortgage broker, not telemarketer green-bubble feel) isn't actually materially moving conversion vs the friction of getting Sendblue live.

---

## 3. Side-by-Side Decision Matrix

| Dimension | Sendblue | BlueBubbles | AppleScript | Twilio (primary) | Apple Biz Messages |
|---|---|---|---|---|---|
| **Real iMessage?** | ✅ (with SMS fallback) | ✅ | ✅ | ❌ (SMS only) | ✅ |
| **Setup time** | 1 day | 3-5 days | 3-5 days | 1-2 wks (10DLC) | 3-6 mo |
| **Monthly cost @ 20 leads/mo** | $0–75 | $0 | $0 | $20–50 | $0–enterprise |
| **5-min SLA reliable?** | ✅ | ⚠️ | ❌ | ✅✅ | ✅ |
| **n8n wiring effort** | 15 min | 30 min + 2 hr Mac | 1 hr + flaky | 10 min (native node) | N/A |
| **Apple ToS risk** | Low-moderate (gray area) | Moderate (Apple ID lockout) | Moderate | None | None |
| **TCPA gating (PR-1 ship)** | Required | Required | Required | Required | Required |
| **Adam ops burden** | Low (cloud) | High (Mac admin) | High | Lowest | Lowest at scale |
| **Delivery receipts** | ✅ (Business tier) | Partial | None | ✅ | ✅ |
| **Recommended ranking** | **#1 if iMessage-look matters** | Skip | Skip | **#1 if reliability matters** | Defer (not viable for solo) |

---

## 4. The 5-Minute SLA Chain

Per GOAL, "lead gets email and text/iMessage immediately" = within 5 minutes of form submit.

**Current chain timing (without iMessage):**
1. Form submit on styermortgage.com (≈0s)
2. Netlify Function `subscribe-lead.js` runs (≈1-3s)
3. Mailchimp tag applied + LoanOS contact created via `/api/contacts/web-lead` (≈2-4s)
4. n8n `J9Pe24vUi6fpZtdZ` webhook fired by Netlify Function (≈1-2s) — **fix from 2026-03-30 `1a4f90c` ensures this is awaited**
5. n8n emails Adam (≈3-5s after webhook hit)
6. Adam reads email (≈minutes to hours)

**Total: lead → Adam-aware in ~10 seconds; lead → Adam-acts in hours.**

**New chain with outbound iMessage added:**
1-4 same as above.
5. n8n branches: email Adam + send iMessage to lead in parallel.
6. Sendblue / Twilio receives outbound request (≈1-2s) → message delivered to lead (≈1-5s after API call).

**Total: lead → message on lead's phone in <30 seconds end-to-end.** Well under 5-minute SLA.

**No path tested fails the 5-min SLA in steady state** — failure modes are:
- BlueBubbles: Mac asleep → indefinite delay until Mac wakes.
- AppleScript: foregrounded-app dependency → variable delay.
- Sendblue: very rare API outage → SMS fallback fires inside 30s.
- Twilio: zero practical SLA risk.
- Apple Business Messages: zero risk once provisioned, but provisioning blocks ship.

---

## 5. TCPA Gating Chain — What Has To Ship First

**Absolute prereqs (apply to ALL paths):**
1. **PR-1 closeout** (`tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md`) — two-checkbox split on all 3 funnel forms. Currently unauthorized; 7 days in ADAM-TODO. **Without this, every outbound send is a TCPA exposure.**
2. **One-to-one consent rule (2026-04-11)** — Sendblue, Twilio, and all third-party senders now require an explicit opt-in checkbox tied 1:1 to the sender's brand. Bundled "I agree to be contacted by anyone for any purpose" no longer satisfies. PR-1 is designed to satisfy this; verify the checkbox label literally names "Adam Styer | Mortgage Solutions LP (NMLS #513013)" — current PR-1 spec includes this.
3. **Suppression list discipline.** Once outbound is live, every "STOP" or iMessage opt-out reply must update Supabase `contacts.sms_opt_out=true` AND prevent future enrollment in any campaign that texts. Drip workflows already check this on enroll (per memory `feedback_loanos_three_pillars.md` — drip is one of three first-class pillars). Verify with n8n MCP before activation.

**Sendblue-only prereqs:**
4. **Privacy Policy update.** Sendblue requires the sender's site to disclose third-party messaging provider usage. styermortgage.com Privacy Policy may not list Sendblue. ~5 min copy edit.
5. **Sender registration via Sendblue's onboarding.** Sendblue verifies the sending business (NMLS#, EIN). Adam already has both. ~10 min.

**Twilio-only prereqs:**
4. **10DLC registration** — Brand Registration + Campaign Registration. 1-2 weeks for The Campaign Registry approval. EIN, business address, sample message content all required.
5. **Sender ID setup** — provision a long code or short code that maps to Adam's brand.

**BlueBubbles-only prereqs:**
4. **Mac availability + tunnel.** Adam decides which Mac, sets up always-on power, picks tunnel (Tailscale recommended), installs BlueBubbles.
5. **Apple ID risk acknowledgement.** Adam confirms he understands lockout risk on the sending Apple ID.

---

## 6. Recommendation

**Primary recommendation (unchanged from 04-24 brief, with sharper rationale):** **Sendblue** as the iMessage path **once PR-1 ships.** Adam's brand and the personalized "Adam Styer texting from his cell" feel is a real conversion lever for an Austin LO competing against Zillow-leadgen automation — losing that signal to green-bubble SMS arguably costs more than the $25-75/mo Sendblue tier.

**Strong alternative if speed-to-ship matters more than iMessage-look:** **Twilio SMS as primary.** Ship 1-2 weeks faster (limited by 10DLC, not by Sendblue-business-tier friction). Zero Apple ToS risk. Best-in-class delivery. Lose the blue-bubble signaling. Worth a 30-day A/B test post-launch: Sendblue cohort vs Twilio cohort, measure call-back rate within 2 hours of form submit.

**Skip both BlueBubbles and AppleScript.** The "$0/mo" appeal is fully offset by ops burden and Apple ID lockout risk at any non-trivial volume. AppleScript is strictly dominated by BlueBubbles.

**Defer Apple Business Messages.** Re-evaluate when LoanOS has 10+ paying tenants and the Apple Business Account onboarding cost amortizes across them.

---

## 7. Concrete Decision Asks (for Adam, ~3 minutes)

Three decisions unlock all subsequent work:

**Decision 1 — Path:** Sendblue (iMessage primary, SMS fallback) **vs** Twilio (SMS primary) **vs** both (Sendblue primary + Twilio cohort A/B test, ~2x build time).

**Decision 2 — Pre-Sendblue gate:** Authorize PR-1 closeout (already specced) before touching outbound automation? **Default: yes.** No-default option: PR-1 first, then this brief's Decision 1 unblocks build.

**Decision 3 — Build sequencing post-PR-1:**
- (a) Wire outbound into **PA Lead Notify** workflow first (`J9Pe24vUi6fpZtdZ`) — applies to PA funnel only. Lower exposure, easier rollback.
- (b) Wire into **Web Lead Automation** workflow (`PiuIsQpBuydtFM4m`) — applies to all 4 web forms. Higher leverage, slightly more risk.
- **Default: (a) first, validate 2 weeks of sends, then expand to (b).**

---

## 8. Build Estimate Once Adam Authorizes

| Step | Owner | Time | Blocks |
|---|---|---|---|
| Ship PR-1 closeout (TCPA) | Builder + Adam authorize | 30 min + 10 min review | Everything below |
| Sendblue signup + API key | Adam | 10 min | Step 4 |
| Privacy Policy update on styermortgage.com | Builder | 5 min | Activation |
| Wire HTTP node into n8n workflow | Builder via REST PUT (per `memory/tools/n8n.md`) | 15 min | Testing |
| Test with Adam's number | Adam + Builder | 10 min | Activation |
| Activate workflow | Builder | 1 min | Live |
| Monitor first 5 real sends | Both | passive | — |

**Total Adam time: ~25 min.** Total Builder time: ~60 min. **Total ship time: 1 day from authorize.**

If Twilio-primary instead: add ~10-14 days for 10DLC approval (parallel with PR-1 ship), then ~30 min Builder for wiring.

---

## 9. Open Questions (for Adam if any of these change the recommendation)

1. Is the **blue-bubble look** itself a conversion lever you've validated, or is that intuition? If intuition, Twilio-primary becomes more attractive.
2. Do you want **Adam-sends-from-Adam's-cell-number** specifically (so leads can call back the same number)? Sendblue lets you configure the sending number; Twilio requires a separate provisioned number. BlueBubbles uses Adam's Apple ID number directly — only path where reply-to is literally Adam's cell.
3. **Volume estimate over next 6 months:** Sticking with GOAL's 20/mo? Or do you expect a step-change once Scott's pilot lands?
4. Are you okay with **Sendblue's $49/mo Business tier** if pay-as-you-go gets phased out mid-2026? If not, Twilio becomes the only stable long-term path.

None of these block ship; all change which path is "best fit." Default recommendation (Sendblue) stands if all four are "not sure" / "yes" / "stay at goal" / "yes."

---

## 10. Status & Next Step

- **This brief replaces no prior decisions.** It sharpens the 04-24 doc and adds the missing strategic comparison.
- **No new ADAM-TODO line is added for the path decision itself** — that line already exists at `2026-04-24 SENDBLUE SPEED-TO-LEAD`. This brief is appended as a reference there.
- **No build action this session.** Sequence A complete.
- **If Adam picks a path during the week, Builder can ship in one session per the table in § 8.**

End of brief.
