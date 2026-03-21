# GOOGLE ADS DISCOVERY REPORT
**Date:** 2026-03-19
**Conducted by:** Cowork

---

## GTM CONTAINER

| Field | Value |
|---|---|
| GTM Container ID | GTM-PQQ6PGLR |
| GTM Account Name | Mortgage Solutions |
| Container Name | Www.styermortgage.com |
| GA4 Measurement ID | G-DDY0H0319S |
| Google Ads Conversion tag exists | **No** |
| └ Conversion ID | Not found |
| └ Conversion Label | Not found |
| └ Fires on trigger | Not found |
| Google Ads Remarketing tag exists | **No** |
| User-defined Variables with AW- | **None** — zero user-defined variables exist |
| Live Version | Version 2 (published 23 days ago by styer.adam@gmail.com) |

> ⚠️ **CRITICAL:** GTM container exists and has a GA4 tag configured — but the GTM snippet is NOT installed on styermortgage.com. The site only loads `script.js`. No `googletagmanager.com` script tag exists anywhere in the HTML source. This means the GA4 tag has never fired on the live site.

---

## GOOGLE ADS ACCOUNT

| Field | Value |
|---|---|
| Account found | **Yes** |
| Account name | The Styer Team At Mortgage Solutions LP |
| Customer ID | **559-405-5109** |
| Signed-in email | styer.adam@gmail.com |
| Account status | Active (dashboard accessible) |
| Existing campaigns | **None** — dashboard shows "Let's start by creating a new campaign" |
| Billing status | **Could not access** — page shows: "Your account's access level doesn't include billing information. Speak with your account admin." |
| Payment method on file | Could not access |
| GA4 linked to Ads | **No** — 1 GA4 property (G-DDY0H0319S) is available to connect but not connected |
| Google Business Profile | Linked (1 linked) |
| Google accounts visible at login | styer.adam@gmail.com |

> ⚠️ **NOTE:** The billing access error suggests this Ads account may be under a manager/MCC account, or Adam is not listed as the billing admin. This needs to be resolved before ads can run. Adam must access this directly.

> ⚠️ **NOTE:** A "Call-Only ads are being deprecated" warning banner appeared — suggesting call-only ads were configured at some point in this account's history, even though no active campaigns exist now.

---

## SITE TAG CHECK

| Field | Value |
|---|---|
| AW- tag firing on styermortgage.com | **No** |
| └ Tag ID found | Not found |
| GTM snippet installed on site | **No** |
| GA4 tag firing on site | **No** (GTM not installed = GA4 never fires) |
| Scripts loaded on homepage | Only `script.js` (custom UI JavaScript) |

---

## GOOGLE SEARCH CONSOLE

| Field | Value |
|---|---|
| styermortgage.com verified | **No** |
| Access status | "Oops, you don't have access to this property" for styer.adam@gmail.com |
| Top 5 queries | Could not access |
| Manual actions or security issues | Could not access |
| Search Console linked to Google Ads | Could not access |

> ⚠️ Search Console is either not set up under styer.adam@gmail.com, or it was set up under a different Google account. The site may be verified under another account (e.g., an agency or prior developer). Adam needs to verify ownership to access performance data.

---

## WHAT'S NEEDED BEFORE ADS CAN LAUNCH

- [ ] **GTM snippet must be installed on styermortgage.com** — add the GTM-PQQ6PGLR `<script>` + `<noscript>` to the site's HTML (Netlify deploy). This is the single fix that also unblocks GA4 tracking.
- [ ] **Google Ads Conversion tag needs to be created in GTM** — create a new "Google Ads Conversion Tracking" tag with a conversion action (to be set up in Ads). Fire it on the /thank-you page trigger.
- [ ] **Google Ads Remarketing tag needs to be added to GTM** — create and fire on All Pages.
- [ ] **/get-preapproved or /thank-you landing page needs to exist** — ads need a destination URL. The /thank-you page exists at styermortgage.com/thank-you. Confirm it is suitable as a post-conversion landing page, or build a dedicated /get-preapproved page.
- [ ] **Billing must be set up in Google Ads** — Adam must log in and add a payment method. Cowork cannot enter payment info.
- [ ] **Billing admin access needs to be confirmed** — the current login (styer.adam@gmail.com) cannot view billing. Adam needs to identify whether there's a manager/MCC account above this one and confirm who the billing admin is.
- [ ] **GA4 needs to be linked to Google Ads** — go to Google Ads → Tools → Data Manager → Connected Products → click "Review & connect" for the 1 available property.
- [ ] **Google Search Console needs to be verified** — add styermortgage.com as a property under styer.adam@gmail.com (via DNS TXT record or HTML file method through Netlify).
- [ ] **Conversion tracking must be verified end-to-end** — after GTM is installed and conversion tag is configured, test the full flow: visit site → submit form → confirm tag fires on /thank-you → confirm conversion registers in Google Ads.

---

## ADAM'S ACTION ITEMS
*(Things only Adam can do — Cowork cannot handle these)*

1. **Billing access** — Log into Google Ads (559-405-5109) and determine who the billing admin is. If it's a manager account, access billing through that account. Add a payment method.
2. **GA4 linking** — In Google Ads → Tools → Data Manager → click "Review & connect" → link G-DDY0H0319S to the Ads account.
3. **Search Console verification** — Go to search.google.com/search-console → Add property → enter `https://styermortgage.com/` → choose verification method (HTML tag via Netlify deploy is fastest).
4. **Confirm /thank-you page is the right conversion page** — confirm this is where users land after submitting the pre-approval or contact form.

---

## READY TO BUILD CAMPAIGNS: ❌ No

**Reason blocking:** Billing not confirmed, GTM not installed on live site (no tracking firing at all), no conversion tag built, GA4 not linked to Ads, Search Console not verified under this account. Six prerequisite items must be completed before the first campaign should go live.

---

## SUMMARY OF WHAT EXISTS vs. WHAT'S MISSING

| Item | Status |
|---|---|
| Google Ads account | ✅ Exists (559-405-5109) |
| GTM container | ✅ Exists (GTM-PQQ6PGLR) |
| GA4 tag in GTM | ✅ Configured (G-DDY0H0319S) |
| GTM installed on live site | ❌ Not installed |
| GA4 firing on live site | ❌ Not firing |
| Google Ads Conversion tag in GTM | ❌ Does not exist |
| Google Ads Remarketing tag in GTM | ❌ Does not exist |
| AW- conversion ID | ❌ Not created yet |
| Billing / payment method | ❌ Could not confirm |
| GA4 linked to Google Ads | ❌ Not linked |
| Search Console verified | ❌ Not verified under styer.adam@gmail.com |
| Active campaigns | ❌ None |
| Conversion landing page | ⚠️ /thank-you exists — needs confirmation |
