# Web Research — 2026-04-14: Accessibility & Core Web Vitals
Session: SEO/SEM PM | Trigger: WCAG contrast fix + ARIA cleanup commit 1879e10

## Sources Researched

### 1. Learn Accessibility | web.dev
URL: https://web.dev/learn/accessibility
Domain: Google (authoritative)
Summary: Comprehensive Google-authored course on web accessibility covering WCAG 2.2 principles, ARIA roles, color contrast requirements (4.5:1 for normal text, 3:1 for large text), keyboard navigation, screen reader compatibility, and automated accessibility auditing with Lighthouse. Directly applicable to mortgage site's WCAG contrast fixes. Google explicitly ties accessibility to Core Web Vitals page experience signals.
Added to notebook: YES

### 2. Accessibility | Articles | web.dev
URL: https://web.dev/articles/accessibility
Domain: Google (authoritative)
Summary: Google's accessibility articles hub — covers intersection of accessibility and SEO (accessible content gets better crawl coverage), role of ARIA labels in improving AI/LLM content comprehension, and performance overlap with CWV (e.g., non-blocking images with alt text improve both LCP and accessibility audits).
Added to notebook: NO (saving bandwidth — covered by Learn Accessibility above)

## Research Notes
- WCAG + accessibility signals increasingly overlap with E-E-A-T (trustworthiness component)
- WebP images (implemented today in commit 1879e10) directly improve LCP → Core Web Vitals → page experience signal
- ARIA cleanup improves screen reader compatibility → broader audience reach + potential Google accessibility bonus in local search
- Key action: run Lighthouse accessibility audit after ARIA changes are fully deployed
