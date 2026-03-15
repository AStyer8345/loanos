import { NextRequest, NextResponse } from 'next/server'

// MISMO 3.4 XML field extraction
// Parses key loan fields, masks SSN to last 4
function extractMISMOFields(xml: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {}

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

  // Borrower info
  const firstName = extract('FirstName') || extract('FIRST_NAME')
  const lastName = extract('LastName') || extract('LAST_NAME')
  if (firstName || lastName) {
    fields.borrowerName = [firstName, lastName].filter(Boolean).join(' ')
  }

  // SSN — mask to last 4 only
  const ssn = extract('SSN') || extract('SOCIAL_SECURITY_NUMBER')
  if (ssn) {
    fields.ssnLast4 = ssn.replace(/[^0-9]/g, '').slice(-4)
  }

  // Property
  const street = extract('AddressLineText') || extract('STREET_ADDRESS')
  const city = extract('CityName') || extract('CITY')
  const state = extract('StateCode') || extract('STATE')
  const zip = extract('PostalCode') || extract('ZIP_CODE')
  if (street || city) {
    fields.propertyAddress = [street, city, state, zip].filter(Boolean).join(', ')
  }

  // Loan details
  const loanAmount = extract('LoanAmount') || extract('BASE_LOAN_AMOUNT') || extractAttr('MORTGAGE_TERMS', 'BaseLoanAmount')
  if (loanAmount) fields.loanAmount = parseFloat(loanAmount.replace(/[^0-9.]/g, ''))

  const purchasePrice = extract('PropertyEstimatedValueAmount') || extract('PurchasePriceAmount') || extractAttr('PROPERTY', 'PurchasePriceAmount')
  if (purchasePrice) fields.purchasePrice = parseFloat(purchasePrice.replace(/[^0-9.]/g, ''))

  const rate = extract('NoteRatePercent') || extract('NOTE_RATE') || extractAttr('MORTGAGE_TERMS', 'NoteRate')
  if (rate) fields.interestRate = parseFloat(rate)

  const term = extract('LoanTermMonths') || extract('ORIGINAL_MORTGAGE_TERM') || extractAttr('MORTGAGE_TERMS', 'OriginalLoanTerm')
  if (term) {
    const months = parseInt(term)
    fields.loanTerm = months > 12 ? Math.round(months / 12) : months
  }

  // Loan type
  const loanType = extract('MortgageType') || extractAttr('MORTGAGE_TERMS', 'MortgageType')
  if (loanType) {
    const typeMap: Record<string, string> = {
      'Conventional': 'conventional',
      'FHA': 'fha',
      'VA': 'va',
      'FarmersHomeAdministration': 'usda',
      'USDA': 'usda',
    }
    fields.loanType = typeMap[loanType] || 'conventional'
  }

  // Monthly costs
  const taxes = extract('RealEstateTaxAmount') || extract('MonthlyTaxAmount')
  if (taxes) fields.propertyTaxes = parseFloat(taxes.replace(/[^0-9.]/g, ''))

  const insurance = extract('HazardInsuranceAmount') || extract('MonthlyInsuranceAmount')
  if (insurance) fields.insurance = parseFloat(insurance.replace(/[^0-9.]/g, ''))

  return fields
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'ZIP support coming soon. Please upload the .xml file directly.' }, { status: 400 })
    }

    const xmlContent = await file.text()

    if (!xmlContent.includes('<') || xmlContent.length < 50) {
      return NextResponse.json({ error: 'Invalid XML file' }, { status: 400 })
    }

    const fields = extractMISMOFields(xmlContent)

    // Log the import (no SSN logging)
    console.log(`[mismo/parse] Extracted ${Object.keys(fields).length} fields from ${file.name}`)

    return NextResponse.json({ fields, filename: file.name })
  } catch (error) {
    console.error('[mismo/parse] error:', error)
    return NextResponse.json({ error: 'Failed to parse MISMO file' }, { status: 500 })
  }
}
