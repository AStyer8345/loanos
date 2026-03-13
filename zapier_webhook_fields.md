# Arive → Supabase Field Mapping
_Generated 2026-03-13 | LoanOS pipeline reference_

This document maps every relevant Arive webhook payload field to its Supabase `loans` table column.

**SSN exclusion rule:** `loanBorrower1_socialSecurityIdentifier` and any other SSN/TIN fields are stripped at the Zapier layer and never forwarded to n8n or Supabase.

---

## Borrower Identity

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `loanBorrower1_emailAddressText` | `borrower_email` | Used as contact upsert key |
| `loanBorrower1_firstName` | `borrower_first_name` | |
| `loanBorrower1_lastName` | `borrower_last_name` | |
| `loanBorrower1_mobilePhone10digit` | `borrower_phone` | Prefer mobile |
| `loanBorrower1_homePhone` | `borrower_home_phone` | NEW |
| `loanBorrower1_workPhone` | `borrower_work_phone` | NEW |
| `loanBorrower1_address_addressLineText` | `borrower_mailing_address` | NEW |
| `loanBorrower1_maritalStatusType` | `borrower_marital_status` | NEW |
| `loanBorrower1_preferedLanguages` | `borrower_preferred_language` | NEW |
| `loanBorrower1_firstTimeHomeBuyer` | `first_time_homebuyer` | BOOLEAN |
| `loanBorrower1_applicantType` | `borrower_applicant_type` | NEW |
| `loanBorrower1_nickName` | _(not stored)_ | Not useful |
| ~~`loanBorrower1_socialSecurityIdentifier`~~ | ~~EXCLUDED~~ | **Strip at Zapier** |

## Co-Borrower

| Arive Field | Supabase Column | Notes |
|---|---|---|
| _(no co-borrower fields in Arive new-loan payload)_ | `co_borrower_name`, `co_borrower_email`, `co_borrower_phone` | Populated via Arive UI or manually |

---

## Loan Identification

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `ariveLoanId` | `arive_loan_id` | **Primary upsert key** |
| `lenderLoanIdentifier` | `lender_loan_number` | NEW |
| `crmReferenceId` | `crm_reference_id` | NEW |
| `deepLinkURL` | `deep_link_url` | NEW |
| `sysGUID` | _(not stored)_ | Internal Arive ID, no use |
| `orgUnitId` | _(not stored)_ | Org unit, not needed |
| `orgUnitDisplayName` | _(not stored)_ | Not needed |

---

## Loan Status / Pipeline

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `currentLoanStatus_status` | `status` | Current milestone |
| `currentLoanStatus_date` | `status_date` | NEW — date of current status |
| `currentLoanStatus_adverseReason` | `adverse_reason` | NEW — denial/withdraw reason |
| `archiveIndicator` | `archive_indicator` | NEW BOOLEAN |
| `archiveDate` | _(not stored)_ | Can derive from archive_indicator |

---

## Loan Amounts & Financial

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `baseLoanAmount` | `base_loan_amount` | NEW |
| `totalLoanAmount` | `loan_amount` | Existing |
| `purchasePriceOrEstimatedValue` | `purchase_price` / `appraised_value` | Map to purchase_price for purchase; appraised_value for refi |
| `downPayment` | `down_payment` | Existing |
| `sellerCredit` | `seller_credits` | Existing |
| `discountPoints` | `points` | Existing |
| `brokerFee` | `broker_fee` | NEW |
| `financedFees` | `financed_fees` | NEW |
| `estCashToClose` | `cash_to_close` | Existing |
| `earnestMoneyDeposit` | `earnest_money` | Existing |
| `compensation` | _(not stored)_ | Dollar amount |
| `compensationType` | `compensation_type` | NEW |
| `grossLoanRevenue` | _(not stored)_ | Internal |
| `netLoanRevenue` | _(not stored)_ | Internal |
| `reimbursements` | _(not stored)_ | Internal |
| `toleranceCures` | _(not stored)_ | Internal |
| `CreditReportFee` | _(not stored)_ | Not needed in loans |

---

## Rates & Terms

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `noteRate` | `interest_rate` | Existing |
| `apr` | `apr` | Existing |
| `loanTerm` | `loan_term` | Existing |
| `amortizationTerm` | `term_months` | Existing (months) |
| `amortizationType` | `amortization_type` | NEW |
| `mortgageType` | `mortgage_type` | NEW (Conventional/FHA/VA/USDA) |
| `lienPosition` | `lien_position` | NEW |
| `documentationType` | `documentation_type` | NEW |
| `buyDown` | `buydown` | NEW BOOLEAN |
| `prepayPenalty` | `prepay_penalty` | NEW BOOLEAN |
| `impoundWaiver` | `impound_waiver` | NEW BOOLEAN |
| `interestOnlyInd` | `interest_only` | NEW BOOLEAN |
| `interestOnlyTermMonthsCount` | `interest_only_term_months` | NEW INTEGER |
| `normalRateAdjustmentPeriod` | `arm_adjustment_period` | NEW INTEGER |
| `initialFixedPeriodEffectiveMonthsCount` | `arm_initial_fixed_months` | NEW INTEGER |

---

## Lock

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `lockDate` | `lock_date` | Existing |
| `lockExpirationDate` | `rate_lock_expiration` | Existing |
| `lockStatus` | `lock_status` | NEW |

---

## LTV / Ratios

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `ltv` | `ltv` | Existing |
| `cltv` | `cltv` | Existing |
| `hcltv` | `hcltv` | NEW |
| `frontEndDTI` | `front_end_dti` | Existing |
| `backEndDTI` | `back_end_dti` | Existing |

---

## Monthly Payment Breakdown

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `firstMortgagePrincipalAndInterestMonthlyAmt` | `pi_payment` | NEW |
| `principalInterestAndPMI` | `monthly_payment` | Existing (P+I+MI) |
| `mIPremiumMonthlyAmt` | `mi_monthly` | Existing |
| `realEstateTaxMonthlyAmt` | `property_tax` | Existing (monthly) |
| `homeownersInsuranceMonthlyAmt` | `hazard_insurance` | Existing (monthly) |
| `floodInsuranceMonthlyAmt` | `flood_insurance_monthly` | NEW |
| `homeownersAssociationDuesAndCondominiumFeesMonthlyAmt` | `hoa_dues` | NEW |
| `totalMonthlyHousingExpenseAmt` | `piti` | Existing |

---

## Subject Property

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `subjectProperty_addressLineText` | `property_address` | Existing |
| `subjectProperty_addressUnitIdentifier` | `property_unit_number` | NEW |
| `subjectProperty_city` | `property_city` | Existing |
| `subjectProperty_state` | `property_state` | Existing |
| `subjectProperty_postalCode` | `property_zip` | Existing |
| `subjectProperty_county` | `county` | Existing |
| `subjectProperty_housingType` | `property_type` | Existing |
| `subjectProperty_attachmentType` | `property_attachment_type` | NEW |
| `subjectProperty_propertyUsageType` | `occupancy_type` | Existing |
| `subjectProperty_financedUnitCount` | `property_units` | NEW INTEGER |
| `subjectProperty_totalConcessionAmt` | `seller_concessions` | Existing |
| `subjectProperty_salesContractAmt` | `sales_price` | Existing |
| `subjectTBDIndicator` | `tbd_address` | NEW BOOLEAN |

---

## Loan Purpose / Type

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `loanPurpose` | `loan_purpose` | Existing |
| `refinanceType` | `refinance_type` | NEW |
| `cashoutPurpose` | `cashout_purpose` | NEW |
| `industryChannel` | `channel` | Existing |
| `leadSource` | `lead_source` | Existing |
| `leadProvidedBy` | `referral_source` | Existing |
| `referralContactSourceName` | `referring_agent_name` | Existing |
| `referralContactSourceEmail` | `referring_agent_email` | Existing |
| `loanCreatedFrom` | _(not stored)_ | |

---

## Loan Team

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `loanOriginatorName` | _(not stored)_ | Always Adam |
| `loanOriginatorEmail` | _(not stored)_ | Always Adam |
| `loanOriginatorPhone` | _(not stored)_ | Always Adam |
| `loanProcessorName` | `processor_name` | Existing |
| `loanProcessorEmail` | `processor_email` | NEW |
| `loanOfficerAssistantName` | _(not stored)_ | |
| `loanOfficerAssistantEmail` | _(not stored)_ | |
| `loanTeamUser1_primary` | _(not stored)_ | |
| `lenderName` | `lender_name` | Existing |
| `lenderNMLS` | `lender_nmls` | NEW |

---

## Key Dates — TRID

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `keyDates_tridDate` | `trid_date` | NEW |
| `keyDates_intentToProceedDate` | `intent_to_proceed_date` | NEW |
| `keyDates_initialLESentDate` | `initial_le_sent_date` | NEW |
| `keyDates_initialLESignedDate` | `initial_le_signed_date` | NEW |
| `keyDates_mostRecentLESentDate` | `most_recent_le_sent_date` | NEW |
| `keyDates_mostRecentLESignedDate` | `most_recent_le_signed_date` | NEW |
| `keyDates_initialCDSentDate` | `initial_cd_sent_date` | NEW |
| `keyDates_initialCDSignedDate` | `initial_cd_signed_date` | NEW |
| `keyDates_mostRecentCDSentDate` | `most_recent_cd_sent_date` | NEW |
| `keyDates_mostRecentCDSignedDate` | `most_recent_cd_signed_date` | NEW |

---

## Key Dates — Appraisal / Credit / HOI / Title

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `keyDates_appraisalOrderedDate` | `appraisal_ordered_date` | NEW |
| `keyDates_appraisalDeliveryDate` | `appraisal_delivery_date` | NEW |
| `keyDates_appraisalContingency` | `appraisal_contingency_date` | NEW |
| `keyDates_creditOrderDate` | `credit_order_date` | NEW |
| `keyDates_creditImportDate` | `credit_import_date` | NEW |
| `keyDates_creditExpirationDate` | `credit_expiration_date` | NEW |
| `keyDates_hoiOrderedDate` | `hoi_ordered_date` | NEW |
| `keyDates_hoiReceivedDate` | `hoi_received_date` | NEW |
| `keyDates_titleOrderedDate` | `title_ordered_date` | NEW |
| `keyDates_titleReceivedDate` | `title_received_date` | NEW |
| `keyDates_taxTranscriptOrderedDate` | `tax_transcript_ordered_date` | NEW |
| `keyDates_taxTranscriptReceivedDate` | `tax_transcript_received_date` | NEW |

---

## Key Dates — Timeline / Closing

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `keyDates_salesContractDate` | `sales_contract_date` | Existing |
| `keyDates_firstPaymentDate` | `first_payment_date` | Existing |
| `keyDates_estFirstPaymentDate` | _(not stored)_ | Same as firstPaymentDate |
| `keyDates_estimatedFundingDate` | `est_closing_date` | Existing (maps to estimated funding) |
| `keyDates_loanContingency` | `loan_contingency_date` | NEW |
| `keyDates_closingContingency` | `closing_contingency_date` | NEW |
| `keyDates_preApprovalExpiryDate` | `pre_approval_expiry_date` | NEW |
| `keyDates_dateToAvoidEPO` | `epo_date` | NEW |
| `createDateTime` | `arive_created_at` | Existing |
| `modifiedDateTime` | `arive_updated_at` | Existing |

---

## Milestone Dates & Statuses

| Arive Field | Supabase Column | Notes |
|---|---|---|
| `CD_date` | `cd_date` | NEW |
| `CD_status` | `cd_status` | NEW |
| `HOI_date` | `hoi_date` | NEW |
| `HOI_status` | `hoi_status` | NEW |
| `TITLE_date` | `title_date` | NEW |
| `TITLE_status` | `title_status` | NEW |
| `PAYROLL_date` | `payroll_date` | NEW |
| `PAYROLL_status` | `payroll_status` | NEW |
| `APPRAISAL_date` | `appraisal_date` | NEW |
| `APPRAISAL_status` | `appraisal_status` | NEW |
| `CLIENT_REVIEW_date` | `client_review_date` | NEW |
| `CLIENT_REVIEW_status` | `client_review_status` | NEW |
| `SIGNED_DOCS_WITH_LENDER_date` | `signed_docs_date` | NEW |
| `SIGNED_DOCS_WITH_LENDER_status` | `signed_docs_status` | NEW |
| `FUNDING_WIRE_date` | `funding_wire_date` | NEW |
| `FUNDING_WIRE_status` | `funding_wire_status` | NEW |
| `APPLICATION_INTAKE` | `application_date` | Existing |

---

## Fields Not Stored (Excluded)

| Arive Field | Reason |
|---|---|
| `loanBorrower1_socialSecurityIdentifier` | **SSN — strip at Zapier, never forward** |
| `loanBorrower1_dayOfBirth`, `loanBorrower1_monthOfBirth` | PII — not needed |
| `loanBorrower1_posAppSubmissionDate` | Not useful |
| `loanBorrower1_borrowerPairLoanAppSequence` | Internal |
| `loanBorrower1_address_durationTermMonths` | Not useful |
| `mersNumberforNonDel` | Funding-level detail |
| `sysGUID`, `orgUnitId`, `orgUnitDisplayName` | Internal Arive IDs |
| `grossLoanRevenue`, `netLoanRevenue`, `reimbursements`, `toleranceCures` | Revenue — internal |
| `CreditReportFee`, `compensation` | Fee detail — not needed in loans row |
| `loanOriginatorName/Email/Phone` | Always Adam |
| `loanOfficerAssistantName/Email` | Not populated |
| `loanTeamUser1_*` | Redundant with loanOriginator fields |
| `keyDates_estFirstPaymentDate` | Redundant with firstPaymentDate |
| `archiveDate` | Can derive from archiveIndicator |
| `loanCreatedFrom` | Not useful |
| `creditRepairIndicator` | Not used |
