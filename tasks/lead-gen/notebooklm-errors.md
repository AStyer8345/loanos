# NotebookLM Error Log — Lead Generation

## 2026-03-27 AM Session

| URL | Error | Action |
|-----|-------|--------|
| https://www.nationalmortgagenews.com/news/how-ai-is-changing-mortgage-marketing-strategy | RPC ADD_SOURCE failed — paywalled/requires authentication | Skipped. Replaced by MPA article (from-loa-to-ai) which covers same topic without paywall. |


## 2026-04-04 PM — Web Research Failures (Refi Watch topic)

| URL | Error | Action |
|-----|-------|--------|
| https://www.nationalmortgagenews.com/news/trigger-lead-limits-push-lenders-toward-new-marketing | Paywall | Skipped |
| https://www.mpamag.com/us/mortgage-industry/market-updates/refi-surge-in-2026-why-brokers-must-do-frequent-reviews/557376 | Cloudflare block | Added + deleted |
| https://www.mpamag.com/us/mortgage-industry/market-updates/why-credit-monitoring-gives-brokers-an-edge-in-the-next-refinance-boom/549257 | Cloudflare block | Added + deleted |
| https://www.mpamag.com/us/specialty/wholesale/uwms-smith-lower-rates-coming-and-brokers-must-be-ready-to-recapture-customers/570387 | Cloudflare block | Added + deleted |

**Note:** mpamag.com is fully Cloudflare-blocked. nationalmortgagenews.com is paywalled. Do not attempt these domains in future sessions.


## 2026-04-05 PM Session

| URL | Error |
|-----|-------|
| https://www.nationalmortgagenews.com/news/lenders-rethink-outreach-as-trigger-leads-face-limits | Paywall — could not add |
| https://www.nationalmortgagenews.com/news/how-mortgage-brokers-are-tapping-ai-to-problem-solve | Paywall — could not add |
| https://www.nationalmortgagenews.com/opinion/why-buying-leads-is-killing-your-mortgage-business | Paywall — could not add |

*Note: All 3 NMN URLs summarized in 2026-04-05-pm-web-research.md which WAS added to NotebookLM.*

## 2026-04-07 PM Session

### Failed URL Adds (paywalled)
- https://www.nationalmortgagenews.com/news/mortgage-customer-retention-tools-proliferate-amid-refi-boomlet
- https://www.nationalmortgagenews.com/news/lenders-predict-2026-rebound-led-by-refis-and-home-equity
Reason: National Mortgage News content behind paywall. Use Scotsman Guide or CFPB as alternatives.

## 2026-05-03 PM — Auth Expired

[2026-05-03 22:09 PM] AUTH EXPIRED: All notebooklm CLI commands returning `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` Cannot run interactively from scheduled task — Adam must run `notebooklm login` manually. PUSH+CURATE skipped this session (no notebook contact possible). Daily digest not generated. Foundational doc refresh deferred to next successful session.


---

## 2026-05-04 AM — Auth Still Expired (2nd consecutive session)

[2026-05-04 03:48 AM] Same `Authentication expired or invalid` failure on `notebooklm list --json`. Skipped both PULL (Step 3 of master-agent.md) and PUSH (Step 8). Continued session per master-agent.md error-handling rule "NotebookLM sync failure NEVER blocks the build chain." Today's session output (`2026-05-04-homepage-forms-conversion-audit.md`) is queued for delayed PUSH whenever Adam runs `/Users/adamstyer/.local/bin/notebooklm login`.

ACTION: Adam must run `/Users/adamstyer/.local/bin/notebooklm login` from a terminal to restore CLI auth. This blocks both Lead Gen + SEO/SEM nightly notebook syncs. Already tracked under SEO/SEM agent's Active blockers in CONTEXT.md.
