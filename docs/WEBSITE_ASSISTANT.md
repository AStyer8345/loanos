# Website assistant service

LoanOS owns all durable assistant records and controlled business operations. Browsers must never call this service directly. The styermortgage.com Netlify gateway calls `POST /api/v1/website-assistant/{operation}` using a scoped HMAC credential.

## Authentication

Each request signs `METHOD`, canonical path, timestamp, nonce, and SHA-256 body digest. LoanOS requires a known key ID, accepts at most five minutes of clock skew, stores nonces to block replay, and requires a separate idempotency key. The credential resolves one configured organization; callers cannot choose an organization in the payload.

Required staging variables are documented in `.env.example`. Rotate credentials by deploying an overlapping key-ID version, moving the website gateway, then removing the prior key. Never reuse `LOANOS_AGENT_SECRET`.

## Controlled operations

| Operation | Side effect | Idempotency/failure behavior |
|---|---|---|
| `create_or_update_website_lead` | Creates or safely attaches to a contact; stores consent evidence | Database advisory locks prevent concurrent website duplicates. Conflicting email/phone matches create a human-review task and are never merged. |
| `create_follow_up_task` | Creates a `todo_items` record assigned to the configured owner | Unique assistant `source_key`; retries return the existing task. |
| `send_application_link` | Chat delivery returns the configured link | Email/text delivery remains disabled and creates a recovery task. |
| `get_available_call_times` | Read-only | Returns unavailable until an approved sandbox provider exists. |
| `schedule_consultation` | None in the current phase | Returns an accurate unavailable result and creates a recovery task. |
| `escalate_to_adam` | Creates a durable task and escalation record | A success response is returned only after both records exist. |
| `record_conversation_turn` | Stores redacted visitor and assistant messages | Sequence key makes retries idempotent. This operation is gateway-owned, not a model tool. |

Every input is schema-validated. Tool inputs and results are redacted before audit storage. The model never receives database credentials and cannot query LoanOS directly.

## Data and retention

`website_conversations`, `website_conversation_messages`, `website_consents`, `website_escalations`, and `ai_action_audit` deny direct authenticated access through RLS. Service-role routes are the only write path. Do not store raw prohibited data or hidden model reasoning.

Provisional retention is two years for redacted conversations and seven years for operational audit records. These periods are implementation placeholders requiring legal approval before staging enablement. Deletion and legal-hold procedures must be approved before production.

## Duplicate resolution

Email is trimmed and lowercased without provider-specific rewriting. Supported phone values are stored as E.164. Email-only or phone-only matches attach to the existing record and update only last-touch and missing normalization/source fields. If email and phone identify different contacts, no merge occurs; Adam receives a conflict-review task.

The initial migration deliberately creates non-unique lookup indexes because existing-data conflicts must be reviewed before a later uniqueness-enforcement migration. The assistant RPC remains concurrency-safe through sorted transaction advisory locks.

## Migration and rollback

Run `20260715130000_website_assistant_foundation.sql` only in an approved staging database first. Before applying, export conflict reports for normalized email and phone. The migration is additive; the rollback statements are included at its end. Do not roll it back after assistant records are relied upon without first exporting those records and confirming retention obligations.

## Recovery and monitoring

Alert on signature failures, replay attempts, duplicate conflicts, failed audit writes, task failures, and provider-unavailable results. Logs may include correlation IDs, operation names, safe status codes, and redacted identifiers; they must not include request bodies, secrets, raw transcripts, or prohibited data.
