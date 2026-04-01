# Send Tab Bug Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 9 bugs found in the Marketing Send tab — most critically the 404 race condition where emails send before pages deploy.

**Architecture:** Two repos are involved. The Netlify functions on styermortgage.com handle content generation, page publishing (via GitHub API), and Mailchimp campaign sends. The LoanOS Next.js app provides the UI forms. Fixes are mostly in the Netlify repo (`shared.js`, `generate-rate-update.js`, `generate-newsletter.js`) with two fixes in LoanOS (`RateUpdateForm.tsx`, `NewsletterForm.tsx`).

**Tech Stack:** Node.js (Netlify Functions), Next.js 14 / React (LoanOS), GitHub API, Mailchimp API, Netlify CDN

---

## File Map

| File | Repo | Action | Responsibility |
|------|------|--------|---------------|
| `netlify/functions/lib/shared.js` | styerteam-mortgage-site | Modify | Add `waitForPageLive()`, fix `forceAbsoluteLinks()`, add `safeRunCampaign()` |
| `netlify/functions/generate-rate-update.js` | styerteam-mortgage-site | Modify | Insert deploy wait before email send, use safe campaign wrapper |
| `netlify/functions/generate-newsletter.js` | styerteam-mortgage-site | Modify | Insert deploy wait, fix temp URL bug, use safe campaign wrapper, add "never say" list |
| `src/app/dashboard/marketing/_components/RateUpdateForm.tsx` | loanos-clone | Modify | Move activity log to after successful response |
| `src/app/dashboard/marketing/_components/NewsletterForm.tsx` | loanos-clone | Modify | Move activity log to after successful response |

---

## Task 1: Add `waitForPageLive()` to shared.js (THE 404 FIX)

**Severity:** CRITICAL — this is the bug where email recipients click and get 404s.

**Root cause:** `createGitHubFile()` returns when GitHub API responds (~100ms). Netlify then builds and deploys in 15-60 seconds. `createAndSendCampaign()` fires immediately after the GitHub response — before the page exists on the CDN.

**Files:**
- Modify: `netlify/functions/lib/shared.js`

- [ ] **Step 1: Add `waitForPageLive()` function to shared.js**

Add this function after `createGitHubFile()` (after line 46, before the Mailchimp section):

```javascript
// ====================================================================
// DEPLOY GATE: Poll a URL until it returns 200 (page is live on CDN)
// Retries every 5s for up to 90s. Returns true if live, false if timed out.
// ====================================================================

async function waitForPageLive(url, { maxWaitMs = 90000, intervalMs = 5000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        console.log(`[deploy-gate] Page live at ${url} (${Date.now() - start}ms)`);
        return true;
      }
    } catch (_) {
      // Network error — keep polling
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  console.warn(`[deploy-gate] Timed out waiting for ${url} after ${maxWaitMs}ms`);
  return false;
}
```

- [ ] **Step 2: Export the new function**

In the `module.exports` block at the bottom of shared.js, add `waitForPageLive`:

```javascript
module.exports = {
  createGitHubFile,
  createAndSendCampaign,
  waitForPageLive,
  injectPageLink,
  forceAbsoluteLinks,
  injectPhotoIntoPersonalSection,
  stripNestedHtmlDocument,
  formatDateForTitle,
  wrapEmailHtml,
};
```

- [ ] **Step 3: Verify no syntax errors**

Run from the styerteam-mortgage-site repo root:
```bash
node -e "require('./netlify/functions/lib/shared.js')"
```
Expected: exits cleanly with no output (no syntax errors).

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/lib/shared.js
git commit -m "feat: add waitForPageLive deploy gate to prevent 404s on email links"
```

---

## Task 2: Wire deploy gate into generate-rate-update.js

**Files:**
- Modify: `netlify/functions/generate-rate-update.js`

- [ ] **Step 1: Import `waitForPageLive`**

Change line 5 from:
```javascript
const { createGitHubFile, createAndSendCampaign, forceAbsoluteLinks, stripNestedHtmlDocument, formatDateForTitle, wrapEmailHtml } = require("./lib/shared");
```
to:
```javascript
const { createGitHubFile, createAndSendCampaign, waitForPageLive, forceAbsoluteLinks, stripNestedHtmlDocument, formatDateForTitle, wrapEmailHtml } = require("./lib/shared");
```

- [ ] **Step 2: Insert deploy wait between GitHub publish and Mailchimp send**

After line 102 (`await createGitHubFile(...)`) and before line 108 (`const results = ...`), add:

```javascript
      // Wait for Netlify to deploy the page before sending emails
      const isLive = await waitForPageLive(pageUrl);
      if (!isLive) {
        console.warn(`[rate-update] Page not confirmed live at ${pageUrl} — proceeding with email send anyway`);
      }
```

**Why warn-and-proceed instead of throw:** A hard failure would mean zero emails if Netlify is slow. Better to log a warning and send — worst case is a brief 404 window, which is still better than no email at all. The 90-second wait covers the vast majority of deploys.

- [ ] **Step 3: Verify no syntax errors**

```bash
node -e "require('./netlify/functions/generate-rate-update.js')"
```
Expected: exits cleanly.

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/generate-rate-update.js
git commit -m "feat: wait for page deploy before sending rate update emails"
```

---

## Task 3: Wire deploy gate into generate-newsletter.js + fix temp URL bug

**Severity:** CRITICAL (deploy gate) + MEDIUM (temp URL returns wrong URL in custom prompt mode)

**Temp URL bug:** In custom prompt mode, `generate-newsletter.js` computes a temporary slug (`temp-placeholder`) for the initial `pageUrl`. After Claude responds, it re-derives the real slug as `finalPageUrl`. But the return value on lines 376-377 uses the original `pageUrl` and `filename` instead of `finalPageUrl` and `finalFilename`. Lines 389-390 also inject the temp URL into preview email HTML.

**Files:**
- Modify: `netlify/functions/generate-newsletter.js`

- [ ] **Step 1: Import `waitForPageLive`**

Change line 7 from:
```javascript
const { createGitHubFile, createAndSendCampaign, injectPageLink, forceAbsoluteLinks, injectPhotoIntoPersonalSection, stripNestedHtmlDocument, wrapEmailHtml } = require("./lib/shared");
```
to:
```javascript
const { createGitHubFile, createAndSendCampaign, waitForPageLive, injectPageLink, forceAbsoluteLinks, injectPhotoIntoPersonalSection, stripNestedHtmlDocument, wrapEmailHtml } = require("./lib/shared");
```

- [ ] **Step 2: Insert deploy wait after GitHub publishes, before Mailchimp**

After line 287 (end of the `updateBlogManifest` call) and before line 293 (`const results = ...`), add:

```javascript
      // Wait for Netlify to deploy the page before sending emails
      const isLive = await waitForPageLive(finalPageUrl);
      if (!isLive) {
        console.warn(`[newsletter] Page not confirmed live at ${finalPageUrl} — proceeding with email send anyway`);
      }
```

- [ ] **Step 3: Fix the return value to use final URLs**

Change lines 376-377 from:
```javascript
      pageUrl,
      filename,
```
to:
```javascript
      pageUrl: finalPageUrl,
      filename: finalFilename,
```

- [ ] **Step 4: Fix preview email HTML to use final URL**

Change lines 389-390 from:
```javascript
        borrowerEmailHtml: parsed.borrowerEmail ? injectPageLink(parsed.borrowerEmail, pageUrl) : null,
        realtorEmailHtml: parsed.realtorEmail ? injectPageLink(parsed.realtorEmail, pageUrl) : null,
```
to:
```javascript
        borrowerEmailHtml: parsed.borrowerEmail ? injectPageLink(parsed.borrowerEmail, finalPageUrl) : null,
        realtorEmailHtml: parsed.realtorEmail ? injectPageLink(parsed.realtorEmail, finalPageUrl) : null,
```

- [ ] **Step 5: Verify no syntax errors**

```bash
node -e "require('./netlify/functions/generate-newsletter.js')"
```
Expected: exits cleanly.

- [ ] **Step 6: Commit**

```bash
git add netlify/functions/generate-newsletter.js
git commit -m "feat: add deploy gate before newsletter emails + fix temp URL bug in custom prompt mode"
```

---

## Task 4: Fix `forceAbsoluteLinks()` — stops corrupting non-CTA links

**Severity:** HIGH — all relative `.html` links in rate update emails get replaced with the current page URL. A "Contact Us" link becomes a link to today's rate page.

**Root cause:** The regex on shared.js line 96 matches any `href="something.html"` and replaces it with `href="${pageUrl}"`. It should only replace the `[PAGE_URL]` placeholder, not all relative links.

**Files:**
- Modify: `netlify/functions/lib/shared.js`

- [ ] **Step 1: Replace the `forceAbsoluteLinks` function**

Replace the entire function (lines 92-106) with:

```javascript
function forceAbsoluteLinks(html, pageUrl) {
  // Replace [PAGE_URL] placeholder with actual URL
  let result = html.replace(/\[PAGE_URL\]/g, pageUrl);

  // Convert relative .html links to absolute by prepending the site origin
  // e.g. href="contact.html" → href="https://styermortgage.com/contact.html"
  // e.g. href="../prequal.html" → left alone (already has path context)
  const siteOrigin = "https://styermortgage.com";
  result = result.replace(
    /href=["']([^"']*?\.html)["']/gi,
    (match, href) => {
      if (href.startsWith("http")) return match;           // already absolute
      if (href.startsWith("../")) {
        // Convert ../ relative to absolute site root
        return `href="${siteOrigin}/${href.replace(/^\.\.\//g, "")}"`;
      }
      if (href.startsWith("/")) return `href="${siteOrigin}${href}"`;  // root-relative
      return `href="${siteOrigin}/${href}"`;                // bare filename → site root
    }
  );

  return result;
}
```

**What changed:**
- Before: ALL relative links → `pageUrl` (the current rate page). Every link was the same.
- After: Relative links get prepended with `https://styermortgage.com/` so `contact.html` → `https://styermortgage.com/contact.html` and `../prequal.html` → `https://styermortgage.com/prequal.html`.

- [ ] **Step 2: Verify no syntax errors**

```bash
node -e "require('./netlify/functions/lib/shared.js')"
```
Expected: exits cleanly.

- [ ] **Step 3: Quick smoke test the function**

```bash
node -e "
const { forceAbsoluteLinks } = require('./netlify/functions/lib/shared');
const html = '<a href=\"[PAGE_URL]\">Rates</a> <a href=\"contact.html\">Contact</a> <a href=\"../prequal.html\">Prequal</a> <a href=\"https://example.com/page.html\">External</a>';
const result = forceAbsoluteLinks(html, 'https://styermortgage.com/rates/2026-04-01.html');
console.log(result);
"
```
Expected output:
```
<a href="https://styermortgage.com/rates/2026-04-01.html">Rates</a> <a href="https://styermortgage.com/contact.html">Contact</a> <a href="https://styermortgage.com/prequal.html">Prequal</a> <a href="https://example.com/page.html">External</a>
```

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/lib/shared.js
git commit -m "fix: forceAbsoluteLinks now resolves relative links to site root instead of page URL"
```

---

## Task 5: Add "never say" list to newsletter custom prompt mode

**Severity:** HIGH — the newsletter custom prompt mode has minimal voice instructions. It can generate "unlock your dream home" and other banned phrases.

**Context:** The rate update prompt (`rate-prompt-builder.js`) and the newsletter structured mode prompt (`prompt-builder.js`) both have the full forbidden buzzwords list. But the newsletter custom prompt mode (inline in `generate-newsletter.js` lines 121-167) only has "No buzzwords, no marketing fluff" — no specific list.

**Files:**
- Modify: `netlify/functions/generate-newsletter.js`

- [ ] **Step 1: Replace the minimal voice section in the custom prompt block**

In `generate-newsletter.js`, find lines 123-124:
```javascript
## ADAM'S VOICE
Write as Adam Styer — mortgage loan originator in Austin, TX. First person "I". Casual, direct, short sentences. No buzzwords, no marketing fluff.
```

Replace with:
```javascript
## ADAM'S VOICE — READ THIS CAREFULLY
Write as Adam — a real human writing to real people. NOT a marketing email. NOT a newsletter template. A person.

TONE: Casual, direct, like a text or quick email to someone you actually know.
- First person "I" always. Short sentences. Short paragraphs.
- NO buzzwords. NO marketing language. NO hype.
- NEVER use: "leverage", "unlock", "dream home", "exciting", "thrilled", "navigate", "empower", "game-changer", "take advantage", "don't miss out", "act now", "incredible opportunity", "market conditions", "poised for", "seize the moment", "strategic advantage"
- Sound like: "Here's the deal", "Real talk", "The short version", "Let me break it down"
```

This matches the voice block from `prompt-builder.js` lines 26-32.

- [ ] **Step 2: Verify no syntax errors**

```bash
node -e "require('./netlify/functions/generate-newsletter.js')"
```
Expected: exits cleanly.

- [ ] **Step 3: Commit**

```bash
git add netlify/functions/generate-newsletter.js
git commit -m "fix: add full 'never say' buzzword list to newsletter custom prompt mode"
```

---

## Task 6: Move activity logging to after successful response (LoanOS)

**Severity:** MEDIUM — if the Netlify function fails, the activity log still shows "Rate Update sent" or "Newsletter sent" because the log entry is persisted before the HTTP response returns.

**Files:**
- Modify: `loanos-clone/src/app/dashboard/marketing/_components/RateUpdateForm.tsx`
- Modify: `loanos-clone/src/app/dashboard/marketing/_components/NewsletterForm.tsx`

- [ ] **Step 1: Fix RateUpdateForm.tsx — move log after response**

In `RateUpdateForm.tsx`, the `handlePublish` function (lines 99-144) currently:
1. Sends fetch request (line 103)
2. Checks response (line 108)
3. Gets data (line 112)
4. Creates log entry (line 116)
5. Calls onSave (line 129)
6. Updates preview (line 131)

This is actually correct — steps 4-5 happen AFTER the response is confirmed `res.ok`. The log is created after `const data = await res.json()` on line 112, which is after the `if (!res.ok)` throw on line 108.

**On closer inspection, this is NOT a bug in RateUpdateForm.** The log entry is created at line 116, which is inside the try block but AFTER the response check. If the Netlify function fails, the throw on line 110 skips the logging code entirely.

Skip this step — no change needed for RateUpdateForm.

- [ ] **Step 2: Verify the same for NewsletterForm.tsx**

In `NewsletterForm.tsx`, `handlePublish` (lines 91-141):
1. Sends fetch (line 95)
2. Checks response (line 100)
3. Gets data (line 104)
4. Creates log entry (line 111)
5. Calls onSave (line 132)

Same pattern — the log entry is created AFTER `const data = await res.json()` on line 104, which is after the `if (!res.ok)` throw. If Netlify fails, logging is skipped.

**This is also NOT a bug.** The earlier audit was wrong — the logging happens after the response is confirmed, not before. No changes needed.

- [ ] **Step 3: Commit (skip)**

No changes to commit. Mark this task as complete — the audit finding was a false positive.

---

## Task 7: Add error isolation for Mailchimp campaign sends

**Severity:** MEDIUM — if the borrower campaign sends but the realtor campaign throws, the function returns a 500 error even though the borrower email already went out. The LoanOS UI shows an error, but one audience already received the email.

**Files:**
- Modify: `netlify/functions/generate-rate-update.js`
- Modify: `netlify/functions/generate-newsletter.js`

- [ ] **Step 1: Wrap individual campaign sends in try-catch in generate-rate-update.js**

Replace lines 123-145 (the two campaign send blocks) with:

```javascript
        if (sendBorrower && parsed.borrowerEmail) {
          try {
            const borrowerResult = await createAndSendCampaign({
              listId: process.env.MAILCHIMP_BORROWER_LIST_ID,
              subject: parsed.borrowerSubject || `Rate Update - ${formatDateForTitle(today)}`,
              preheader: parsed.borrowerPreheader || "",
              html: wrapEmailHtml(parsed.borrowerEmail),
              fromName: "Adam Styer",
              replyTo: "adam@thestyerteam.com",
            });
            results.campaigns.push({ audience: "borrower", ...borrowerResult });
          } catch (err) {
            console.error("[rate-update] Borrower campaign failed:", err.message);
            results.campaigns.push({ audience: "borrower", status: "error", error: err.message });
          }
        }

        if (sendRealtor && parsed.realtorEmail) {
          try {
            const realtorResult = await createAndSendCampaign({
              listId: process.env.MAILCHIMP_REALTOR_LIST_ID,
              subject: parsed.realtorSubject || `Rate Update - ${formatDateForTitle(today)}`,
              preheader: parsed.realtorPreheader || "",
              html: wrapEmailHtml(parsed.realtorEmail),
              fromName: "Adam Styer",
              replyTo: "adam@thestyerteam.com",
            });
            results.campaigns.push({ audience: "realtor", ...realtorResult });
          } catch (err) {
            console.error("[rate-update] Realtor campaign failed:", err.message);
            results.campaigns.push({ audience: "realtor", status: "error", error: err.message });
          }
        }
```

- [ ] **Step 2: Same pattern in generate-newsletter.js**

Replace lines 310-334 (the two campaign send blocks) with:

```javascript
        if (sendBorrower && parsed.borrowerEmail) {
          try {
            const borrowerResult = await createAndSendCampaign({
              listId: process.env.MAILCHIMP_BORROWER_LIST_ID,
              subject: parsed.borrowerSubject || `${effectiveTopic} - Adam Styer | Mortgage Solutions LP`,
              preheader: parsed.borrowerPreheader || "",
              html: wrapEmailHtml(injectPageLink(parsed.borrowerEmail, finalPageUrl)),
              fromName: "Adam Styer",
              replyTo: "adam@thestyerteam.com",
              scheduleTime: scheduleTime || null,
            });
            results.campaigns.push({ audience: "borrower", ...borrowerResult });
          } catch (err) {
            console.error("[newsletter] Borrower campaign failed:", err.message);
            results.campaigns.push({ audience: "borrower", status: "error", error: err.message });
          }
        }

        if (sendRealtor && parsed.realtorEmail) {
          try {
            const realtorResult = await createAndSendCampaign({
              listId: process.env.MAILCHIMP_REALTOR_LIST_ID,
              subject: parsed.realtorSubject || `${effectiveTopic} - Adam Styer | Mortgage Solutions LP`,
              preheader: parsed.realtorPreheader || "",
              html: wrapEmailHtml(injectPageLink(parsed.realtorEmail, finalPageUrl)),
              fromName: "Adam Styer",
              replyTo: "adam@thestyerteam.com",
              scheduleTime: scheduleTime || null,
            });
            results.campaigns.push({ audience: "realtor", ...realtorResult });
          } catch (err) {
            console.error("[newsletter] Realtor campaign failed:", err.message);
            results.campaigns.push({ audience: "realtor", status: "error", error: err.message });
          }
        }
```

- [ ] **Step 3: Verify no syntax errors in both files**

```bash
node -e "require('./netlify/functions/generate-rate-update.js')" && node -e "require('./netlify/functions/generate-newsletter.js')"
```
Expected: exits cleanly.

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/generate-rate-update.js netlify/functions/generate-newsletter.js
git commit -m "fix: isolate Mailchimp campaign errors so one audience failure doesn't block the other"
```

---

## Task 8: Deploy and verify

- [ ] **Step 1: Push styerteam-mortgage-site changes**

```bash
cd /path/to/styerteam-mortgage-site
git push origin main
```

This triggers a Netlify deploy of the functions.

- [ ] **Step 2: Verify Netlify deploy succeeded**

Check Netlify dashboard or CLI for successful deploy of the functions.

- [ ] **Step 3: End-to-end smoke test — rate update preview**

From LoanOS Send tab, run a preview-mode rate update. Confirm:
- No errors
- Preview URL is correctly formatted (`https://styermortgage.com/rates/YYYY-MM-DD.html`)

- [ ] **Step 4: End-to-end smoke test — newsletter preview (custom prompt mode)**

From LoanOS Send tab, switch to Newsletter > Custom Prompt mode. Enter a test prompt. Run preview. Confirm:
- Preview URL uses the real slug, NOT `temp-placeholder`
- Email preview HTML contains the correct URL

- [ ] **Step 5: End-to-end smoke test — rate update live send**

Send a real rate update to a test segment or single recipient. Confirm:
- Page is live at the returned URL before the email arrives
- Email links resolve to the correct page (no 404)
- No "unlock", "dream home", or other banned phrases in email copy

---

## Summary of Changes

| Bug # | Severity | Fix | Task |
|-------|----------|-----|------|
| 1 | CRITICAL | Deploy gate — poll URL before email send | Tasks 1-3 |
| 2 | HIGH | Full "never say" list in newsletter custom prompt | Task 5 |
| 3 | HIGH | Fix `forceAbsoluteLinks()` to resolve to site root | Task 4 |
| 4 | MEDIUM | Isolate Mailchimp send errors per audience | Task 7 |
| 5 | MEDIUM | False positive — logging already happens after response | Task 6 (no-op) |
| 6 | MEDIUM | Voice guide Supabase ↔ Netlify disconnect — deferred (requires passing voice guide in payload, bigger architectural change) | Future |
| 7 | LOW | Same-day overwrites — deferred (rare edge case) | Future |
| 8 | LOW | No n8n visibility — informational, no fix needed | N/A |
| 9 | MEDIUM | Newsletter returns temp URL in custom prompt mode | Task 3 |
