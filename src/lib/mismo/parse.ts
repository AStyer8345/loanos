// Pure MISMO 3.4 XML parser.
// Regex-based walk by tag name — tolerant of whatever nesting the source uses.
// Never throws: malformed or unrecognizable input yields an all-null ParsedMismo.

export interface ParsedMismo {
  borrower: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    ssn_last4: string | null
  }
  property: {
    address: string | null
    city: string | null
    state: string | null
    zip: string | null
    purchase_price: number | null
    property_taxes_monthly: number | null
    insurance_monthly: number | null
  }
  loan: {
    loan_amount: number | null
    loan_type: 'conventional' | 'fha' | 'va' | 'usda' | null
    loan_term_months: number | null
    interest_rate: number | null
    loan_number: string | null
  }
}

function emptyResult(): ParsedMismo {
  return {
    borrower: {
      first_name: null,
      last_name: null,
      email: null,
      phone: null,
      ssn_last4: null,
    },
    property: {
      address: null,
      city: null,
      state: null,
      zip: null,
      purchase_price: null,
      property_taxes_monthly: null,
      insurance_monthly: null,
    },
    loan: {
      loan_amount: null,
      loan_type: null,
      loan_term_months: null,
      interest_rate: null,
      loan_number: null,
    },
  }
}

function parseMoney(s: string | undefined | null): number | null {
  if (!s) return null
  const cleaned = s.replace(/[^0-9.]/g, '')
  if (!cleaned) return null
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? null : n
}

function normalizePhone(s: string | undefined | null): string | null {
  if (!s) return null
  const digits = s.replace(/[^0-9]/g, '')
  if (digits.length < 10) return null
  return digits.slice(-10)
}

function normalizeLoanType(raw: string | undefined | null): ParsedMismo['loan']['loan_type'] {
  if (!raw) return null
  const v = raw.trim()
  if (/^conventional$/i.test(v)) return 'conventional'
  if (/^fha$/i.test(v)) return 'fha'
  if (/^va$/i.test(v)) return 'va'
  if (/^usda$/i.test(v)) return 'usda'
  if (/^FarmersHomeAdministration$/i.test(v)) return 'usda'
  if (/^USDARuralDevelopment$/i.test(v)) return 'usda'
  return null
}

export function parseMismo(xml: string): ParsedMismo {
  const result = emptyResult()

  if (!xml || typeof xml !== 'string') return result
  if (xml.length < 50 || !xml.includes('<')) return result

  // Helper to extract value from XML tag
  const extract = (tag: string): string | undefined => {
    const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i')
    const match = xml.match(regex)
    return match?.[1]?.trim()
  }

  // Extract attribute
  const extractAttr = (tag: string, attr: string): string | undefined => {
    const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]+)"`, 'i')
    const match = xml.match(regex)
    return match?.[1]?.trim()
  }

  // Borrower
  result.borrower.first_name = extract('FirstName') || extract('FIRST_NAME') || null
  result.borrower.last_name = extract('LastName') || extract('LAST_NAME') || null
  result.borrower.email =
    extract('ContactPointEmailValue') || extract('Email') || extract('EmailAddress') || null
  result.borrower.phone = normalizePhone(
    extract('ContactPointTelephoneValue') || extract('Phone') || extract('PhoneNumber')
  )

  const ssn = extract('SSN') || extract('SOCIAL_SECURITY_NUMBER')
  if (ssn) {
    const digits = ssn.replace(/[^0-9]/g, '')
    result.borrower.ssn_last4 = digits.length >= 4 ? digits.slice(-4) : null
  }

  // Property
  result.property.address = extract('AddressLineText') || extract('STREET_ADDRESS') || null
  result.property.city = extract('CityName') || extract('CITY') || null
  result.property.state = extract('StateCode') || extract('STATE') || null
  result.property.zip = extract('PostalCode') || extract('ZIP_CODE') || null

  result.property.purchase_price = parseMoney(
    extract('SalesContractAmount') ||
      extract('PurchasePriceAmount') ||
      extract('PropertyEstimatedValueAmount') ||
      extractAttr('PROPERTY', 'PurchasePriceAmount')
  )
  result.property.property_taxes_monthly = parseMoney(
    extract('RealEstateTaxAmount') || extract('MonthlyTaxAmount')
  )
  result.property.insurance_monthly = parseMoney(
    extract('HazardInsuranceAmount') || extract('MonthlyInsuranceAmount')
  )

  // Loan
  result.loan.loan_amount = parseMoney(
    extract('BaseLoanAmount') ||
      extract('LoanAmount') ||
      extract('BASE_LOAN_AMOUNT') ||
      extractAttr('MORTGAGE_TERMS', 'BaseLoanAmount')
  )

  result.loan.loan_type = normalizeLoanType(
    extract('MortgageType') || extractAttr('MORTGAGE_TERMS', 'MortgageType')
  )

  const termRaw =
    extract('LoanAmortizationPeriodCount') ||
    extract('LoanTermMonths') ||
    extract('ORIGINAL_MORTGAGE_TERM') ||
    extractAttr('MORTGAGE_TERMS', 'OriginalLoanTerm')
  if (termRaw) {
    const n = parseInt(termRaw, 10)
    result.loan.loan_term_months = Number.isNaN(n) ? null : n
  }

  const rateRaw =
    extract('NoteRatePercent') ||
    extract('NOTE_RATE') ||
    extractAttr('MORTGAGE_TERMS', 'NoteRate')
  if (rateRaw) {
    const n = parseFloat(rateRaw)
    result.loan.interest_rate = Number.isNaN(n) ? null : n
  }

  const loanNumber =
    extract('LenderLoanIdentifier') || extract('LoanIdentifier') || extract('LenderCaseIdentifier')
  result.loan.loan_number = loanNumber ? loanNumber.trim() : null

  return result
}
