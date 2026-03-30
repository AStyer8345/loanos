# Automation Card v2 — PDF Upload + Inline Editing

## Goal
Merge the existing workflow card (PDF upload → n8n fire-and-forget) with the automation card (Claude draft → inline edit → send) into one unified flow per card.

## Flow per card
1. User clicks GENERATE (or upload button for PDF-based automations)
2. For PDF automations: file picker opens, user selects PDF
3. PDF stored in Supabase storage (`documents` bucket) + metadata in `documents` table
4. PDF sent to Claude for field extraction (base64, PDF vision)
5. Extracted fields + loan context → Claude generates personalized email draft
6. Draft appears inline — editable subject + body
7. Activity log updated (document uploaded + draft generated)
8. User can refine with AI, edit directly
9. SEND → n8n webhook → Outlook draft
10. Activity log updated (email sent)

## Automation types

### PDF-upload automations (triggerType: 'pdf')
| Automation ID | Upload Label | What PDF | Extraction Logic |
|---|---|---|---|
| pre-approval-email | Upload PA Letter | Pre-Approval letter | Loan amount, rate, program, expiry, property |
| cd-email | Upload CD | Closing Disclosure | Closing date, cash to close, monthly payment, rate |
| app-received | Upload 1003 | Loan application | Borrower info, loan amount, property, program |
| contract-received | Upload Contract | Purchase contract | Sales price, address, closing date, earnest money, option period |

### Text-input automations (triggerType: 'form')
| Automation ID | Input Label | What user pastes |
|---|---|---|
| referral-intro (contact) | Paste Referral Details | Agent name, borrower info, notes |

### No-upload automations (triggerType: 'generate')
Everything else — generates from existing loan/contact data in DB:
- doc-request, pre-approval-agent, processing-update, conditional-approval,
  closing-prep, thank-you, review-request, referral-thank-you, application-link, nurture-followup

## Files to modify

### 1. `src/lib/automations/definitions.ts`
- Add `triggerType: 'pdf' | 'form' | 'generate'` to AutomationDef
- Add `triggerLabel?: string` (button text, e.g. "Upload PA Letter")
- Add `docType?: string` (for documents table, e.g. "pre_approval_letter")
- Add `extractionPrompt?: string` or reference to extraction logic
- Default triggerType to 'generate' for automations that don't need uploads

### 2. `src/components/automations/AutomationCard.tsx`
- New states: idle → uploading → extracting → generating → draft → refining → sending → sent
- For 'pdf' type: GENERATE button becomes upload button, opens file picker
- On file select: upload to Supabase storage, insert documents row, then call generate API with file
- For 'form' type: show text input area, then call generate with text
- For 'generate' type: same as current (just call generate)
- Show extraction status ("Extracting fields from PA letter...")

### 3. `src/app/api/automations/generate/route.ts`
- Accept optional FormData with PDF file (instead of just JSON body)
- If PDF provided:
  1. Upload PDF to Supabase storage (`{userId}/{loanId}/{timestamp}_{filename}`)
  2. Insert row in `documents` table
  3. Convert PDF to base64, send to Claude for field extraction
  4. Use extracted fields to build richer AutomationRecord
  5. Generate email with extracted context
- If no PDF: current behavior (generate from DB fields)
- Log activity for document upload + draft generation

### 4. `src/lib/automations/prompts.ts`
- Update per-automation instructions to use extracted PDF fields when available
- Each PDF automation gets extraction instructions (what fields to pull from the PDF)

## Build order
1. Update definitions.ts with new fields
2. Update generate route to accept PDF + do extraction + storage
3. Update AutomationCard with upload flow + new states
4. Test each PDF automation type
5. Remove redundant WORKFLOWS array entries (they're now handled by automation cards)

## Key constraints
- PDF upload uses same storage pattern as existing document upload: `{userId}/{loanId}/{timestamp}_{filename}`
- Documents table insert includes: user_id, loan_id, file_name, file_path, file_size, doc_type, organization_id
- Keep existing refine + send routes unchanged
- Activity log entries for: doc uploaded, draft generated, email sent
