# Compliance Closeout PR — Drop-In Spec
**Date:** 2026-05-06 AM
**Author:** Lead Gen agent (autonomous, scheduled-task SKILL.md mode)
**Type:** PR spec (for Adam authorize → Builder execute → ship to styerteam-mortgage-site)
**Status:** READY FOR ADAM REVIEW
**Repo touched:** `styerteam-mortgage-site` only (Netlify auto-deploy on push)
**Estimated ship time:** ~30 min Builder + ~5 min Adam review = 35 min total
**Compliance impact:** closes 4 of 5 series-level FAILs; fully resolves BLOCKER-001 in `tasks/lead-gen/BLOCKERS.md`

---

## 1. Why this PR exists

The Lead Gen agent ran 4 sequential funnel-page audits (2026-05-01 → 2026-05-05) producing 20 HIGH-tier findings across `/get-preapproved.html`, `/rate-alert.html`, `index.html` (homepage 2 forms), and `/thank-you.html`. Across the four audits the **single most repeated finding is TCPA bundled-consent on a required checkbox** — same problem, three pages, same fix shape. A 4th high-leverage finding (`/thank-you.html` H1) is a 5-line JS edit that closes a separate compliance UX gap.

Bundling the four H1 findings into one PR:
- Resolves BLOCKER-001 in full (TCPA two-checkbox split on all 3 funnel forms — homepage hero-quick-form, homepage quick-contact-form, rate-alert.html).
- Fixes the "tighter wording" gap on `/get-preapproved.html` (already has two checkboxes, but checkbox A still bundles phone + email + text in its label and uses "Consent is not a condition of purchase" instead of the FTC/CFPB-preferred "Consent is not required to obtain a loan" — Bug-003 in BLOCKERS.md).
- Closes the `/thank-you.html` H1 voice/UX gap where the 3-step "What Happens Next" block ("Letter or quote in 24 hrs") is shown to rate-alert / ftb-dpa-guide / lo-waitlist branches, where no letter is coming.

Why this matters under TCPA's 2026 one-to-one consent rule (effective 2026-04-11, sourced in NotebookLM `2026-04-25-tcpa-sms-one-to-one-consent-web.md`): each marketing channel (voice, SMS, email) must be independently consented. Bundling SMS into a required checkbox creates exposure the moment Sendblue iMessage is wired — which is on this week's GOALS.md as "Speed to lead — PRIORITY". This PR must ship before Sendblue is wired; otherwise the iMessage send fires against bundled consent.

---

## 2. Files modified (5)

| # | File | Purpose | Lines touched |
|---|------|---------|---------------|
| 1 | `index.html` | Split TCPA on hero-quick-form (Quick Quote) | 400–406 |
| 2 | `index.html` | Split TCPA on quick-contact-form | 706–712 |
| 3 | `rate-alert.html` | Split TCPA on rate-alert form | 413–419 |
| 4 | `get-preapproved.html` | Tighten checkbox A wording (channels + "loan" phrasing) | 386–391 |
| 5 | `thank-you.html` | Hide #ty-steps for 3 mismatched `?type=` branches | 628–635, 714–719 |
| 6 | `script.js` | Propagate `email_consent` + `sms_opt_in` from both homepage forms | ~404–411 (quick-contact submitForm) + ~519–528 (hero-quick-form submit) |

`subscribe-lead.js` and the LoanOS `/api/contacts/web-lead` endpoint already accept arbitrary body fields and pass through `lead_source` (verified per 2026-05-05 inline `curl` audit). No backend changes required for compliance ship — fields land in the contact metadata via the existing pass-through. Lead-scoring rules can read `sms_opt_in` later if Adam wants to score it.

---

## 3. Per-file diffs

### 3.1 `index.html` — hero-quick-form (Quick Quote)

**Current (lines 400–406):**
```html
<!-- TCPA consent -->
<div class="hero-quick-form-field" style="grid-column:1/-1;margin-top:4px;">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.8rem;font-weight:400;color:rgba(255,255,255,0.92);text-shadow:0 1px 2px rgba(0,0,0,0.4);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="tcpa_consent" required style="margin-top:3px;flex-shrink:0;width:18px;height:18px;accent-color:#8B6E24;">
    <span>I agree to be contacted by Adam Styer via phone, email, or text about mortgage options. Consent is not a condition of purchase. Msg &amp; data rates may apply. Reply STOP to opt out.</span>
  </label>
</div>
```

**Proposed:**
```html
<!-- Checkbox A: required, phone + email only (no SMS) -->
<div class="hero-quick-form-field" style="grid-column:1/-1;margin-top:4px;">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.8rem;font-weight:400;color:rgba(255,255,255,0.92);text-shadow:0 1px 2px rgba(0,0,0,0.4);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="email_consent" required style="margin-top:3px;flex-shrink:0;width:18px;height:18px;accent-color:#8B6E24;">
    <span>I agree to be contacted by Adam Styer via phone or email about mortgage options. Consent is not required to obtain a loan.</span>
  </label>
</div>
<!-- Checkbox B: optional, SMS opt-in (TCPA one-to-one consent, 2026 FCC rules) -->
<div class="hero-quick-form-field" style="grid-column:1/-1;margin-top:4px;">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.8rem;font-weight:400;color:rgba(255,255,255,0.92);text-shadow:0 1px 2px rgba(0,0,0,0.4);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="sms_opt_in" style="margin-top:3px;flex-shrink:0;width:18px;height:18px;accent-color:#8B6E24;">
    <span>(Optional) Yes, also text me at the number above. Msg &amp; data rates may apply. Reply STOP to cancel. Consent is not required to obtain a loan.</span>
  </label>
</div>
```

### 3.2 `index.html` — quick-contact-form

**Current (lines 706–712):**
```html
<!-- TCPA consent -->
<div class="hero-quick-form-field" style="grid-column:1/-1;margin-top:4px;">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.75rem;font-weight:400;color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="tcpa_consent" required style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>I agree to be contacted by Adam Styer via phone, email, or text about mortgage options. Consent is not a condition of purchase. Msg &amp; data rates may apply. Reply STOP to opt out.</span>
  </label>
</div>
```

**Proposed:**
```html
<!-- Checkbox A: required, phone + email only (no SMS) -->
<div class="hero-quick-form-field" style="grid-column:1/-1;margin-top:4px;">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.75rem;font-weight:400;color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="email_consent" required style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>I agree to be contacted by Adam Styer via phone or email about mortgage options. Consent is not required to obtain a loan.</span>
  </label>
</div>
<!-- Checkbox B: optional, SMS opt-in -->
<div class="hero-quick-form-field" style="grid-column:1/-1;margin-top:4px;">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.75rem;font-weight:400;color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="sms_opt_in" style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>(Optional) Yes, also text me at the number above. Msg &amp; data rates may apply. Reply STOP to cancel. Consent is not required to obtain a loan.</span>
  </label>
</div>
```

### 3.3 `rate-alert.html` — TCPA on rate-alert form

**Current (lines 413–419):**
```html
<!-- TCPA consent -->
<div class="hero-quick-form-field" style="grid-column:1/-1;margin-top:4px;">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.75rem;font-weight:400;color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="tcpa_consent" required style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>I agree to be contacted by Adam Styer via phone, email, or text about mortgage options. Consent is not a condition of purchase. Msg &amp; data rates may apply. Reply STOP to opt out.</span>
  </label>
</div>
```

**Proposed (rate-alert is an EMAIL product — checkbox A is email-only consent, not phone+email):**
```html
<!-- Checkbox A: required, email-only consent (rate-alert is a weekly email product) -->
<div class="hero-quick-form-field" style="grid-column:1/-1;margin-top:4px;">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.75rem;font-weight:400;color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="email_consent" required style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>I'd like to receive Austin Rate Watch emails from Adam Styer | Mortgage Solutions LP. Unsubscribe anytime via the link in every email.</span>
  </label>
</div>
<!-- Checkbox B: optional, SMS opt-in for rate-move alerts -->
<div class="hero-quick-form-field" style="grid-column:1/-1;margin-top:4px;">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:0.75rem;font-weight:400;color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="sms_opt_in" style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>(Optional) Text me when rates move 0.25%+ in a week. Msg &amp; data rates may apply. Reply STOP to opt out. Consent is not required to obtain a loan.</span>
  </label>
</div>
```

Rate-alert is the most defensible split — the user is *literally* signing up for an email product, so coercing phone consent into the required checkbox was the worst-fit case across the four pages.

### 3.4 `get-preapproved.html` — tighten checkbox A wording

**Current (lines 385–397):**
```html
<!-- TCPA consent — required, unchecked by default -->
<div class="lp-form-field full" style="margin-top:var(--spacing-sm);">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:var(--font-size-xs);font-weight:var(--font-weight-normal);color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="tcpa_consent" id="gpa-tcpa" required style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>I agree to be contacted by Adam Styer via phone, email, or text about mortgage options. Consent is not a condition of purchase. Msg &amp; data rates may apply. Reply STOP to opt out.</span>
  </label>
</div>
<!-- SMS opt-in — separate, optional, unchecked by default (TCPA one-to-one consent, 2026 FCC rules) -->
<div class="lp-form-field full" style="margin-top:var(--spacing-xs,8px);">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:var(--font-size-xs);font-weight:var(--font-weight-normal);color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="sms_opt_in" id="gpa-sms-optin" style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>Yes, I also consent to receive automated text messages from Adam Styer at the number I provided. This is separate and optional. Message frequency varies. Reply STOP to cancel.</span>
  </label>
</div>
```

**Proposed (only checkbox A label changes; rename to `email_consent` for parity with the other 3 forms; checkbox B keeps `sms_opt_in` but adds the "loan" phrase):**
```html
<!-- Checkbox A — required, phone + email only (no SMS) -->
<div class="lp-form-field full" style="margin-top:var(--spacing-sm);">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:var(--font-size-xs);font-weight:var(--font-weight-normal);color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="email_consent" id="gpa-email-consent" required style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>I agree to be contacted by Adam Styer via phone or email about mortgage options. Consent is not required to obtain a loan.</span>
  </label>
</div>
<!-- Checkbox B — optional SMS opt-in (TCPA one-to-one consent, 2026 FCC rules) -->
<div class="lp-form-field full" style="margin-top:var(--spacing-xs,8px);">
  <label style="display:flex;align-items:flex-start;gap:8px;font-size:var(--font-size-xs);font-weight:var(--font-weight-normal);color:var(--color-gray);cursor:pointer;line-height:1.5;">
    <input type="checkbox" name="sms_opt_in" id="gpa-sms-optin" style="margin-top:3px;flex-shrink:0;width:16px;height:16px;">
    <span>(Optional) Yes, also text me at the number above. Msg &amp; data rates may apply. Reply STOP to cancel. Consent is not required to obtain a loan.</span>
  </label>
</div>
```

`get-preapproved.html` line 566 already reads `sms_opt_in` from the form into the body sent to subscribe-lead.js, so no JS edit needed for this page. Field rename `tcpa_consent` → `email_consent` is consistent with the 3 other forms; downstream Netlify Forms and subscribe-lead.js receive whatever the body contains, no schema break.

### 3.5 `thank-you.html` — hide #ty-steps for 3 branches

**Current (lines 628–636):**
```js
if (type === 'ftb-dpa-guide') {
  if (h1) h1.textContent = 'Your Austin DPA Guide Is On Its Way';
  if (paras.length > 0) paras[0].textContent = 'Check your inbox — it’ll arrive in the next few minutes. If you don’t see it, check your spam folder and mark us as “not spam.”';
  if (phoneCta) phoneCta.innerHTML = 'Ready to find out which programs you qualify for? Book a free 15-minute call with Adam — no credit pull, no obligation. <br><a href="https://mslp.my1003app.com/513013/register" style="font-size:0.9em;opacity:0.8;">Or start your application &rarr;</a>';
} else if (type === 'rate-alert') {
  if (h1) h1.textContent = "You're on the Austin Rate Watch List";
  if (paras.length > 0) paras[0].textContent = "Check your inbox — your first rate update arrives this Friday. If you don’t see it, check your spam folder and mark us as “not spam.”";
  if (phoneCta) phoneCta.innerHTML = 'While you wait: <a href="/austin-mortgage-rates.html">See current Austin mortgage rates &rarr;</a>';
  if (calendlySection) calendlySection.style.display = 'none';
}
```

**Proposed (add `#ty-steps` hide to ftb-dpa-guide + rate-alert + lo-waitlist branches):**
```js
if (type === 'ftb-dpa-guide') {
  if (h1) h1.textContent = 'Your Austin DPA Guide Is On Its Way';
  if (paras.length > 0) paras[0].textContent = 'Check your inbox — it’ll arrive in the next few minutes. If you don’t see it, check your spam folder and mark us as “not spam.”';
  if (phoneCta) phoneCta.innerHTML = 'Ready to find out which programs you qualify for? Book a free 15-minute call with Adam — no credit pull, no obligation. <br><a href="https://mslp.my1003app.com/513013/register" style="font-size:0.9em;opacity:0.8;">Or start your application &rarr;</a>';
  var stepsSectionFtb = document.getElementById('ty-steps');
  if (stepsSectionFtb) stepsSectionFtb.style.display = 'none';  // No "letter or quote" coming for DPA guide leads.
} else if (type === 'rate-alert') {
  if (h1) h1.textContent = "You're on the Austin Rate Watch List";
  if (paras.length > 0) paras[0].textContent = "Check your inbox — your first rate update arrives this Friday. If you don’t see it, check your spam folder and mark us as “not spam.”";
  if (phoneCta) phoneCta.innerHTML = 'While you wait: <a href="/austin-mortgage-rates.html">See current Austin mortgage rates &rarr;</a>';
  if (calendlySection) calendlySection.style.display = 'none';
  var stepsSectionRa = document.getElementById('ty-steps');
  if (stepsSectionRa) stepsSectionRa.style.display = 'none';  // No "letter or quote" coming for rate-alert subscribers.
}
```

**Current (lines 714–719) — lo-waitlist branch:**
```js
} else if (type === 'lo-waitlist') {
  if (h1) h1.textContent = "You're on the LoanOS Waitlist";
  if (paras.length > 0) paras[0].textContent = "I'll reach out personally when LoanOS is ready for other LOs. No spam — just honest build updates.";
  if (phoneCta) phoneCta.innerHTML = 'Questions? <a href="mailto:adam@thestyerteam.com">Email Adam directly.</a>';
  if (calendlySection) calendlySection.style.display = 'none';
}
```

**Proposed (add hide):**
```js
} else if (type === 'lo-waitlist') {
  if (h1) h1.textContent = "You're on the LoanOS Waitlist";
  if (paras.length > 0) paras[0].textContent = "I'll reach out personally when LoanOS is ready for other LOs. No spam — just honest build updates.";
  if (phoneCta) phoneCta.innerHTML = 'Questions? <a href="mailto:styer.adam@gmail.com">Email Adam directly.</a>';
  if (calendlySection) calendlySection.style.display = 'none';
  var stepsSectionLoanos = document.getElementById('ty-steps');
  if (stepsSectionLoanos) stepsSectionLoanos.style.display = 'none';  // No mortgage-flow steps for LO waitlist signups.
}
```

**Note bonus fix (lo-waitlist branch line 717):** `mailto:adam@thestyerteam.com` violates global CLAUDE.md "never use The Styer Team" rule. Recommended replacement: Adam's actual email `styer.adam@gmail.com` (per user-context). Adam should override if he prefers a different inbox.

### 3.6 `script.js` — propagate `email_consent` + `sms_opt_in` from both homepage forms

**Current — quick-contact `submitForm` body (lines 401–412):**
```js
fetch('/.netlify/functions/subscribe-lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email, fname, lname, phone,
    tag: 'quick-contact-lead',
    loan_goal: loanGoal,
    lead_source: 'Quick Contact',
    page_url: window.location.href,
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
  }),
}).catch((err) => console.warn('[quick-contact] subscribe-lead failed:', err.message)),
```

**Proposed — extract the two consent fields BEFORE the fetch and add to body:**
```js
const emailConsent = formData.get('email_consent') === 'on';
const smsOptIn = formData.get('sms_opt_in') === 'on';
// ... existing extraction ...
fetch('/.netlify/functions/subscribe-lead', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email, fname, lname, phone,
    tag: 'quick-contact-lead',
    loan_goal: loanGoal,
    lead_source: 'Quick Contact',
    email_consent: emailConsent,
    sms_opt_in: smsOptIn,
    page_url: window.location.href,
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
  }),
}).catch((err) => console.warn('[quick-contact] subscribe-lead failed:', err.message)),
```

**Current — hero-quick-form body (lines 519–528):**
```js
body: JSON.stringify({
  email, fname, lname, phone,
  tag: 'quick-quote-lead',
  loan_goal: loanGoal,
  lead_source: 'Quick Quote',
  page_url: window.location.href,
  utm_source: params.get('utm_source') || '',
  utm_medium: params.get('utm_medium') || '',
  utm_campaign: params.get('utm_campaign') || '',
}),
```

**Proposed (mirror change above):**
```js
const emailConsent = formData.get('email_consent') === 'on';
const smsOptIn = formData.get('sms_opt_in') === 'on';
// ... existing extraction ...
body: JSON.stringify({
  email, fname, lname, phone,
  tag: 'quick-quote-lead',
  loan_goal: loanGoal,
  lead_source: 'Quick Quote',
  email_consent: emailConsent,
  sms_opt_in: smsOptIn,
  page_url: window.location.href,
  utm_source: params.get('utm_source') || '',
  utm_medium: params.get('utm_medium') || '',
  utm_campaign: params.get('utm_campaign') || '',
}),
```

---

## 4. Test plan (post-deploy)

Run all 6 in order. ANY failure → roll back, do not partial-deploy.

1. **Visit `https://styermortgage.com/`** in incognito. Hero Quick Quote shows two stacked checkboxes (A: required label says "phone or email"; B: optional label says "Optional"). Submit with only A checked → success redirect to `/thank-you?type=quick-quote`. Network tab confirms POST to `/.netlify/functions/subscribe-lead` with `email_consent: true, sms_opt_in: false` in body.
2. **Same page, scroll to Quick Contact section.** Two stacked checkboxes appear. Same submit pattern, same body shape, `lead_source: 'Quick Contact'`.
3. **Visit `https://styermortgage.com/rate-alert.html`** in incognito. Two stacked checkboxes. Submit with only A → confirm POST body has `email_consent: true, sms_opt_in: false`. Note: A copy specifically says "Austin Rate Watch emails" — distinct from the homepage forms.
4. **Visit `https://styermortgage.com/get-preapproved.html`** in incognito. Two stacked checkboxes — A label now says "phone or email" (not "phone, email, or text") and uses "loan" (not "purchase"). Submit → POST body has `email_consent: true, sms_opt_in: false`.
5. **Visit `https://styermortgage.com/thank-you?type=rate-alert`** directly. The 3-step "What Happens Next" block at `#ty-steps` is **hidden**. Calendly stays visible. H1 reads "You're on the Austin Rate Watch List".
6. **Visit `https://styermortgage.com/thank-you?type=ftb-dpa-guide`** directly. Same: `#ty-steps` hidden. Phone CTA still present. Calendly visible.
7. **Visit `https://styermortgage.com/thank-you?type=preapproval`** directly. `#ty-steps` is **visible** (PA path is the only branch that should still see "Letter or quote in 24 hrs"). H1 reads "Your Pre-Approval Request Was Received".
8. **Open Supabase** (read-only) and confirm one of the test contacts above landed with the new fields visible (likely in `metadata jsonb` if the `contacts` table doesn't have dedicated columns yet — sufficient for compliance audit trail).

---

## 5. Compliance impact

| Series-level FAIL | Source audit | Closes? |
|---|---|---|
| TCPA bundled-consent on homepage Quick Quote (forced phone/email/text on a single required checkbox) | 2026-05-04 H1 | ✅ Yes |
| TCPA bundled-consent on homepage Quick Contact (same shape, same risk) | 2026-05-04 H1 | ✅ Yes |
| TCPA bundled-consent on `/rate-alert.html` (worst case — user signs up for email-only product yet consents to SMS) | 2026-05-02 H1 | ✅ Yes |
| `/thank-you.html` Step 3 promise mismatch with rate-alert / FTB-DPA / lo-waitlist branches (UX integrity FAIL — voice rule "never make a promise we can't keep") | 2026-05-05 H1 | ✅ Yes |
| `thestyerteam.com` reference on `/thank-you.html` lo-waitlist branch (Voice rule violation) | 2026-05-05 M5 | ✅ Yes (bundled with thank-you fix above) |

| FAIL NOT closed by this PR | Source | Why deferred |
|---|---|---|
| `/get-preapproved.html` missing licensed branch address (Texas SAFE Act / NMLS MU.4) | 2026-05-01 M5 | Footer-address fix is its own ~10-min PR; bundles with cross-page footer audit (PR-3 in 05-05 ship-order plan). Not blocking compliance closeout. |

**BLOCKER-001 status after this PR ships:** RESOLVED. All 3 funnel forms use two-checkbox pattern with TCPA-compliant copy on both A (required, phone+email or email-only) and B (optional, SMS).

---

## 6. Risk assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Field rename `tcpa_consent` → `email_consent` breaks Netlify Forms aggregation | LOW | LOW | Netlify Forms accepts arbitrary fields; the change just renames a column on the Netlify dashboard. No downstream automation reads the Netlify side. |
| `subscribe-lead.js` chokes on the new `email_consent` body field | NONE | — | Audit confirmed the function spreads body straight through (`{ ...body, lead_source: body.lead_source || 'Website' }` pattern); arbitrary additional fields ride along to LoanOS. |
| LoanOS `/api/contacts/web-lead` rejects the body | NONE | — | Same pattern: route already accepts arbitrary metadata (sms_opt_in is already accepted from `/get-preapproved.html` line 566 — so `email_consent` rides along the same way). |
| Existing required-checkbox JS validators reject submission because `tcpa_consent` is absent | LOW | MEDIUM | All four pages use HTML `required` attribute + `validateField()` which checks `input.required && !input.value`. Rename is invisible to that validator (it just walks `form.querySelectorAll('input...')`). No JS allowlist references `tcpa_consent` by name (audited via grep). |
| Hidden `#ty-steps` regresses for `?type=preapproval` (highest-intent branch) | NONE | — | The proposed JS only adds `style.display = 'none'` inside three specific branches (`ftb-dpa-guide`, `rate-alert`, `lo-waitlist`). The `preapproval` branch and the default fallback are untouched and continue to render `#ty-steps`. |
| Visual regression on dark hero TCPA block in `index.html` (white text on dark navy) | LOW | LOW | Both proposed checkboxes inherit the same parent `style="..."` block as the original — only the `<input name>` and `<span>` text change. Visual diff: 1 row → 2 rows, ~22 px taller. |

---

## 7. Out of scope (do NOT bundle into this PR)

- HIGH-tier conversion findings (H2/H3/H4/H5 across the 4 audits) — defer to PR-2 once compliance ships.
- M-tier and L-tier findings — defer to PR-3+ per existing 05-04 / 05-05 ADAM-TODO ship-order plans.
- Loan Goal taxonomy unification (`/get-preapproved` M6 + homepage H4) — separate ~25-min PR; touches LoanOS dashboard segmentation downstream.
- Sendblue iMessage wiring — explicit Adam-blocked dependency on TCPA copy approval (this PR closes the dependency on its own; Sendblue then becomes a ~15-min n8n node + Adam's API key away).
- subscribe-lead.js or LoanOS `/api/contacts/web-lead` schema changes — none required (verified above).
- Mailchimp Customer Journey trigger updates — none required (existing `pre-approval-funnel` / `rate-alert` tag triggers untouched).

---

## 8. Builder execution checklist

When Adam authorizes this PR, builder should:

1. Open `styerteam-mortgage-site` repo, branch `compliance-closeout-2026-05-06` (or similar).
2. Apply the 6 diffs above. Match indentation exactly — files use mixed tabs/spaces in places.
3. `git add` only the 5 touched files: `index.html`, `rate-alert.html`, `get-preapproved.html`, `thank-you.html`, `script.js`.
4. Local manual verification in `.claude/site-server.js` (port 8766): all 4 forms render two checkboxes; the 3 thank-you branches hide `#ty-steps`; PA branch keeps it.
5. `git commit -m "compliance(closeout): TCPA two-checkbox split on 4 forms + thank-you branch fix"` (single commit; do not split).
6. `git push origin <branch>` — Netlify auto-builds preview. Verify preview deploy URL matches expected behavior on all test-plan steps.
7. Adam merges to main → Netlify production deploy → re-run test plan against production URL.
8. Update `tasks/lead-gen/BLOCKERS.md` BLOCKER-001 status: RESOLVED, dated 2026-05-06.
9. Update `tasks/ADAM-TODO.md` — flip the four 05-01/05-02/05-04/05-05 audit lines to `[x]` (now-shipped) and the carryover BLOCKER-001 ask to `[x]` (resolved).

---

## 9. Why agent didn't ship this directly

Per `tasks/lead-gen/master-agent.md` STEP 6, the master orchestrator runs Sequence A (Research only) when there is no Adam authorize signal. Sequence C (Execute) requires either: (a) an explicit ADAM-TODO `[x]` authorization line, (b) a brand-new spec that Adam has acknowledged in chat, or (c) a Builder run already in progress. None of those conditions are met for the styerteam-mortgage-site repo today. The scheduled-task SKILL.md additionally restricts this run from "write" actions outside the lead-gen project files. Authoring this spec is the highest-leverage Sequence A output available.

---

## 10. References

- Audits this PR consolidates:
  - `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md` (H1 + Bug-003 carryover)
  - `tasks/lead-gen/research/2026-05-02-rate-alert-conversion-audit.md` (H1)
  - `tasks/lead-gen/research/2026-05-04-homepage-forms-conversion-audit.md` (H1, both forms)
  - `tasks/lead-gen/research/2026-05-05-thank-you-page-audit.md` (H1, M5)
- Active blocker resolved: `tasks/lead-gen/BLOCKERS.md` BLOCKER-001
- Compliance source: `tasks/lead-gen/notebooklm-pull-2026-04-25.md` (2026-04-25 TCPA one-to-one consent NotebookLM web source) — note CLI auth currently expired (5th day); source already in notebook from prior run
- Voice guide: `tasks/social-media/adam-voice-and-workflow.md` (no `thestyerteam.com`; no marketing-speak; promises must be keepable)
- Global rule: `/Users/adamstyer/Documents/CLAUDE.md` ("never use 'The Styer Team' — always 'Adam Styer | Mortgage Solutions LP'")
