# Inquiry delivery release — September 5, 2026

The website and Netlify capture share one inquiry ID. LoanOS atomically saves the inquiry, contact match, one owned follow-up task, inquiry milestone, activity reference, and notification outbox. Replaying the same event returns the original records. A later inquiry from the same person remains a separate opportunity; conflicting names or multiple identity matches are held for review.

Raw inquiry data is encrypted with the existing PII encryption key. Authenticated readers receive only tenant-scoped operational fields. Profile membership and role changes are restricted to trusted server routes; ordinary users retain editing access to their name, NMLS, phone, licensed states, and signature.

The n8n worker claims pending notifications once, creates an Outlook draft with inquiry/outbox headers, records its immutable message ID, sends that draft, and records provider acceptance. Acceptance is not delivery confirmation. Stalled attempts require reconciliation against the recorded message before any resend. An hourly recovery trigger handles never-attempted pending work and stays quiet when empty.

Internal tests use verified Adam mailboxes, skip marketing enrollment and borrower confirmation, and perform no ARIVE writes. Tests are excluded from lead reporting. Qualification follow-ups do not send another borrower confirmation.

Deployment order: apply additive migrations; release LoanOS; publish the validated n8n worker; verify controlled delivery and replay; release the website; restrict redundant Netlify owner-email rules after verification. Recovery exports are private in the Command Center overnight recovery directory. Do not commit workflow exports containing credentials or raw borrower payloads.

Validation includes transactional retry/matching tests, tenant/profile permission probes, inquiry unit tests, production builds, website form audits, controlled provider receipts, and authenticated production inspection. Record actual deployment IDs and integration results in the overnight handoff; this file describes the protocol, not an unverified claim of delivery.
