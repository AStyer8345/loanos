# Web Research — LO Onboarding Build Session 1
Date: 2026-03-28 PM
Session: Enterprise PM — LO Onboarding Build Session 1 (backend APIs + migration)

---

## Topic: Next.js CSV Upload + PapaParse

**Papa Parse — Official Documentation**
https://www.papaparse.com/
Official PapaParse library docs. Covers header detection, skipEmptyLines, transformHeader, and error handling. Used directly in csv-import/route.ts this session.

**Better Stack: Parsing CSV Files with Papa Parse (Node.js)**
https://betterstack.com/community/guides/scaling-nodejs/parsing-csv-files-with-papa-parse/
Complete guide for server-side PapaParse in Node.js including stream processing and error handling patterns. Relevant for large CSV imports (1000+ contacts) in future Session 3 QA work.

**File Upload in Next.js App Router (formData)**
https://medium.com/@_hanglucas/file-upload-in-next-js-app-router-13-4-6d24f2e3d00f
Demonstrates `request.formData()` for multipart uploads in the App Router. Pattern used in csv-import route this session.

---

## Topic: SaaS Onboarding Wizard Best Practices

**Appcues: SaaS User Onboarding Examples & Best Practices 2025**
https://www.appcues.com/blog/saas-user-onboarding
Authoritative onboarding platform blog. Key patterns: progress bars, celebration moments, time-to-value < 5 minutes. Directly applicable to the 4-step Getting Started wizard.

---

## Topic: CSV Dedup (already in notebook)

CSVBox duplicate patterns already in notebook (ca0fa02a). No duplicate needed.

---

## Summary
- PapaParse used in csv-import/route.ts — official docs confirm correct API usage
- formData pattern confirmed for multipart file uploads in App Router
- Onboarding wizard design: 5-min TTV, progress indication, email-based dedup — all in spec
