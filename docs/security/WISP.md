# Written Information Security Program (WISP)
**Adam Styer | Mortgage Solutions LP** — NMLS #513013
**Effective Date:** 2026-03-18
**Review Frequency:** Annual (or after any security incident)

---

## 1. Purpose
This document establishes how Adam Styer | Mortgage Solutions LP protects Non-Public Personal Information (NPI) of mortgage borrowers, in compliance with the FTC Safeguards Rule (16 CFR Part 314) and Texas Business & Commerce Code §521.

## 2. Designated Qualified Individual
**Adam Styer** is designated as the Qualified Individual responsible for overseeing this information security program.

## 3. Data We Hold
| Data Type | Where Stored | Who Can Access |
|-----------|-------------|----------------|
| Borrower name, address, SSN (last 4 only), income, assets | Supabase (encrypted at rest) | Authenticated users only |
| Loan details, rates, terms | Supabase | Authenticated users, scoped by org |
| Uploaded documents (pay stubs, bank statements) | Supabase Storage (encrypted) | Authenticated users, RLS enforced |
| Email correspondence | Supabase activity_log | Authenticated users, scoped by org |
| Scenario / analysis data | Supabase | User who created it |

## 4. Access Controls
- **Authentication:** Supabase email/password with MFA enabled
- **Authorization:** Row-Level Security (RLS) — every database table has policies restricting rows to the owning user/organization
- **API routes:** Internal automation routes require `Authorization: Bearer <secret>` header (secret stored in Vercel env vars, rotated on any suspected exposure)
- **Service role key:** Never exposed client-side. Used only in server-side API routes.
- **Rate limiting:** Sensitive routes (chat, scenario generation) are rate-limited to prevent abuse

## 5. Encryption
- **In transit:** All traffic served over HTTPS (TLS 1.2+) via Vercel
- **At rest:** Supabase encrypts all data at rest using AES-256

## 6. Third-Party Services
| Service | Data Shared | Security |
|---------|------------|----------|
| Supabase | All borrower data | SOC 2 Type II certified |
| Vercel | Application code only | SOC 2 Type II certified |
| Anthropic (Claude) | Loan summaries for AI features | No data retained per Anthropic API policy |
| n8n (styer.app.n8n.cloud) | Loan status events | Credential-protected webhooks |
| Zapier | Arive → n8n bridge | OAuth2 authenticated |

## 7. Risk Assessment Schedule
Annual review each January covering:
- New data flows added during the year
- Third-party service changes
- Access control audit (run RLS audit SQL)
- Incident review

## 8. Incident Response
If a data breach is suspected:
1. **Isolate** — revoke the compromised credential immediately (Supabase service role key, Vercel env vars)
2. **Assess** — determine which borrower records were accessible (query security_audit_log)
3. **Notify** — Texas law (§521.053) requires notifying affected individuals within 60 days of discovery
4. **Document** — log the incident, what was accessed, and remediation steps in security_audit_log
5. **Review** — update this WISP within 30 days of resolution

## 9. Data Retention
- **Active borrower records:** Retained indefinitely while account is active
- **Closed loan files:** Retained 3 years minimum (RESPA requirement)
- **Deletion requests:** Handled manually by the Qualified Individual within 30 days
- **Automated purge:** Not yet implemented — planned for Phase 4
- See: `docs/security/data-retention-policy.md` for full schedule

## 10. Employee / Contractor Access
Currently a single-operator business. Any future contractors or licensed LOs added to the platform will receive the minimum access required for their role and will be removed immediately upon end of engagement.

---

*Next review due: January 2027*
