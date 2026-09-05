# Contract and conditional-approval review foundation

Documents are matched to an authorized loan, hashed, versioned and assigned an internal review task. The upload-time baseline, extraction proposals and review notes are encrypted. Normal members can read safe version metadata in their organization; only the authenticated application exposes the matching decrypted review. Unknown extraction confidence and missing citations remain explicit.

Each new version preserves the prior version and closes its obsolete pending review task. Repeated upload hashes, extraction claims, callbacks and review submissions are deduplicated or held. A changed source hash prevents source access, extraction or review until it is saved as a new version. Review records retain reviewer, date, source, decision, current baseline and created tasks. The review operation never changes loan financial fields or an underwriting decision, and never writes ARIVE or sends borrower messages.

Use the loan's Documents panel → Contract and conditional-approval reviews. Save a source, then review manually or explicitly request extraction for that version. Adam approved only explicitly requested extraction on September 5, 2026. The authenticated extraction API requires explicit_request=true, and a callback is accepted only for a version with a durable prior extraction claim. Saving a source never initiates extraction. DOCUMENT_EXTRACTION_ENABLED controls availability. Saving a document does not automatically forward its contents for extraction. Do not process or forward sensitive identity/income documents through this path. Controlled integration verification uses only a synthetic internal PDF.

Select useful condition tasks, confirm citations and choose the owner, routing and any evidenced due date. Borrower/title/insurance/appraisal work uses waiting states; loan-officer requests are escalated. An absent team account stays unassigned. Extraction is not approval. Source-record changes remain a separate authorized action.

## Workflow replacement and recovery

On 2026-09-05 the existing contract workflow UfNcdpoVKQZqy0fj version 12784c89-eb16-4cff-992e-5d2825630805 was prepared for replacement. The prior 22-node graph wrote financial fields before review and had two overlapping database webhook triggers plus the interactive UI caller. Preserve its recoverable n8n version and the private overnight recovery/n8n-before.json; do not restore its unreviewed financial-write behavior during ordinary rollback.

The seven-node graph, published after its protected API was deployed, accepts an authenticated review reference, fetches its short-lived authorized PDF source, uses the existing extraction credential and stores only an encrypted review proposal through the protected LoanOS callback. No contact writer, loan writer, mail draft, ARIVE export or outgoing-message node remains in its graph. Source data is not saved in successful/error/manual execution logs. The API durably claims extraction first. Ambiguous acceptance stays held instead of automatically repeating; manual review is available after 15 minutes. A configured existing processor is required for extraction; manual review works independently.

Migration 20260905141141 replaces these legacy trigger attachments with one internal review-task capture (old functions remain disconnected):
- CREATE TRIGGER contract_uploaded_trigger AFTER INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION notify_n8n_contract();
- CREATE TRIGGER on_contract_document_inserted AFTER INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION notify_n8n_contract_received();

The second trigger called net.http_post with a text body where the installed function expects jsonb, rejecting contract inserts. Re-enabling either trigger without reviewing its full write path is unsafe. The new capture is transaction-local and creates no external request. Registering the version closes the initial capture task so only one pending task remains.

## Verification

Five focused parser tests cover supported fields, unknown confidence, citations, routing, invalid values and sensitive-number rejection. Rolled-back SQL fixtures cover upload deduplication, version links, extraction claims/callback deduplication, one active task, obsolete-version holds, cross-organization read/assignment rejection, review replay rejection, private column/function grants, and byte-for-byte unchanged loan row. Live HTTP and workflow evidence belongs in the private overnight recovery folder.

Preapproval and other PDF automations are separate legacy paths; this release does not claim they are all migrated to this review foundation.

Production verification used only the internal synthetic PDF: one explicit request, one cited condition, one extraction attempt, deduplicated callback, selected owned task, rejected review replay and byte-for-byte unchanged loan. The internal task was completed after verification.
