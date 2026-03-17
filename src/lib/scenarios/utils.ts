import type { ClosingCostBreakdown } from './types'

export const DEFAULT_CLOSING_COSTS: ClosingCostBreakdown = {
  // Lender Fees
  originationFee: 0,
  underwritingFee: 1295,
  processingFee: 995,
  applicationFee: 0,
  adminFee: 0,
  // Third Party Fees
  appraisal: 795,
  creditReport: 110,
  docPrepFee: 495,
  floodCert: 15,
  attorneyFee: 125,
  settlementFee: 550,
  titleSearch: 125,
  titleEndorsements: 12,
  recordingFee: 200,
  lendersTitlePolicy: 2119,
  // Prepaids
  prepaidInterestDays: 15,
  annualHazardInsurance: 0,
  taxEscrowMonths: 0,
  insuranceEscrowMonths: 0,
}

/** Guards against DB-loaded scenarios saved before closingCostBreakdown existed */
export function ensureClosingCosts(b: ClosingCostBreakdown | undefined | null): ClosingCostBreakdown {
  if (!b || typeof b !== 'object') return { ...DEFAULT_CLOSING_COSTS }
  return {
    originationFee: b.originationFee ?? 0,
    underwritingFee: b.underwritingFee ?? 0,
    processingFee: b.processingFee ?? 0,
    applicationFee: b.applicationFee ?? 0,
    adminFee: b.adminFee ?? 0,
    appraisal: b.appraisal ?? 0,
    creditReport: b.creditReport ?? 0,
    docPrepFee: b.docPrepFee ?? 0,
    floodCert: b.floodCert ?? 0,
    attorneyFee: b.attorneyFee ?? 0,
    settlementFee: b.settlementFee ?? 0,
    titleSearch: b.titleSearch ?? 0,
    titleEndorsements: b.titleEndorsements ?? 0,
    recordingFee: b.recordingFee ?? 0,
    lendersTitlePolicy: b.lendersTitlePolicy ?? 0,
    prepaidInterestDays: b.prepaidInterestDays ?? 15,
    annualHazardInsurance: b.annualHazardInsurance ?? 0,
    taxEscrowMonths: b.taxEscrowMonths ?? 0,
    insuranceEscrowMonths: b.insuranceEscrowMonths ?? 0,
  }
}

export function sumClosingCosts(b: ClosingCostBreakdown): number {
  return (
    b.originationFee + b.underwritingFee + b.processingFee + b.applicationFee + b.adminFee +
    b.appraisal + b.creditReport + b.docPrepFee + b.floodCert + b.attorneyFee +
    b.settlementFee + b.titleSearch + b.titleEndorsements + b.recordingFee + b.lendersTitlePolicy
    // Prepaids excluded — they depend on rate/loan amount and are displayed separately
  )
}
