import { describe, it, expect } from 'vitest'
import { parseMismo } from '@/lib/mismo/parse'

describe('parseMismo', () => {
  it('extracts borrower, property, and loan fields from a minimal MISMO snippet', () => {
    const xml = `<?xml version="1.0"?>
      <MESSAGE>
        <DEAL>
          <PARTIES>
            <PARTY>
              <INDIVIDUAL>
                <NAME>
                  <FirstName>Jane</FirstName>
                  <LastName>Doe</LastName>
                </NAME>
                <CONTACT_POINTS>
                  <ContactPointEmailValue>jane@example.com</ContactPointEmailValue>
                  <ContactPointTelephoneValue>(512) 555-1234</ContactPointTelephoneValue>
                </CONTACT_POINTS>
                <SSN>123-45-6789</SSN>
              </INDIVIDUAL>
            </PARTY>
          </PARTIES>
          <COLLATERALS>
            <PROPERTY>
              <ADDRESS>
                <AddressLineText>123 Main St</AddressLineText>
                <CityName>Austin</CityName>
                <StateCode>TX</StateCode>
                <PostalCode>78701</PostalCode>
              </ADDRESS>
              <SalesContractAmount>450000</SalesContractAmount>
              <RealEstateTaxAmount>625.50</RealEstateTaxAmount>
              <HazardInsuranceAmount>125</HazardInsuranceAmount>
            </PROPERTY>
          </COLLATERALS>
          <LOANS>
            <LOAN>
              <LenderLoanIdentifier>LN-00042</LenderLoanIdentifier>
              <BaseLoanAmount>360000</BaseLoanAmount>
              <MortgageType>Conventional</MortgageType>
              <LoanAmortizationPeriodCount>360</LoanAmortizationPeriodCount>
              <NoteRatePercent>6.875</NoteRatePercent>
            </LOAN>
          </LOANS>
        </DEAL>
      </MESSAGE>`

    const result = parseMismo(xml)

    expect(result.borrower.first_name).toBe('Jane')
    expect(result.borrower.last_name).toBe('Doe')
    expect(result.borrower.email).toBe('jane@example.com')
    expect(result.borrower.phone).toBe('5125551234')
    expect(result.borrower.ssn_last4).toBe('6789')

    expect(result.property.address).toBe('123 Main St')
    expect(result.property.city).toBe('Austin')
    expect(result.property.state).toBe('TX')
    expect(result.property.zip).toBe('78701')
    expect(result.property.purchase_price).toBe(450000)
    expect(result.property.property_taxes_monthly).toBe(625.5)
    expect(result.property.insurance_monthly).toBe(125)

    expect(result.loan.loan_amount).toBe(360000)
    expect(result.loan.loan_type).toBe('conventional')
    expect(result.loan.loan_term_months).toBe(360)
    expect(result.loan.interest_rate).toBe(6.875)
    expect(result.loan.loan_number).toBe('LN-00042')
  })

  it('returns all-null ParsedMismo on empty string without throwing', () => {
    const result = parseMismo('')

    expect(result.borrower.first_name).toBeNull()
    expect(result.borrower.last_name).toBeNull()
    expect(result.borrower.email).toBeNull()
    expect(result.borrower.phone).toBeNull()
    expect(result.borrower.ssn_last4).toBeNull()

    expect(result.property.address).toBeNull()
    expect(result.property.city).toBeNull()
    expect(result.property.state).toBeNull()
    expect(result.property.zip).toBeNull()
    expect(result.property.purchase_price).toBeNull()
    expect(result.property.property_taxes_monthly).toBeNull()
    expect(result.property.insurance_monthly).toBeNull()

    expect(result.loan.loan_amount).toBeNull()
    expect(result.loan.loan_type).toBeNull()
    expect(result.loan.loan_term_months).toBeNull()
    expect(result.loan.interest_rate).toBeNull()
    expect(result.loan.loan_number).toBeNull()
  })

  it('returns all-null ParsedMismo on non-MISMO XML without throwing', () => {
    const result = parseMismo('<?xml version="1.0"?><NotMismo/>')

    expect(result.borrower.first_name).toBeNull()
    expect(result.borrower.last_name).toBeNull()
    expect(result.property.address).toBeNull()
    expect(result.loan.loan_amount).toBeNull()
    expect(result.loan.loan_type).toBeNull()
    expect(result.loan.loan_term_months).toBeNull()
    expect(result.loan.interest_rate).toBeNull()
    expect(result.loan.loan_number).toBeNull()
  })
})
