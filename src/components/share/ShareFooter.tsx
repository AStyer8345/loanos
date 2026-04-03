import { TEXT, BORDER } from './constants'

interface ShareFooterProps {
  company?: string
  nmls?: string
  loName?: string
  phone?: string
  email?: string
}

export default function ShareFooter({
  company = 'Adam Styer | Mortgage Solutions LP',
  nmls = '513013',
  loName = 'Adam Styer',
  phone,
  email,
}: ShareFooterProps) {
  const contactParts = [loName, phone, email].filter(Boolean)

  return (
    <footer className="pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
      {/* Contact line — visible on screen and print */}
      <p className="text-[10px] font-medium mb-2" style={{ color: `${TEXT}50` }}>
        {company}{nmls ? ` · NMLS #${nmls}` : ''}
        {contactParts.length > 0 && (
          <span style={{ color: `${TEXT}35` }}> · {contactParts.join(' · ')}</span>
        )}
      </p>
      <p className="text-[10px] leading-relaxed mb-2" style={{ color: `${TEXT}30` }}>
        This analysis is for informational purposes only and does not constitute a loan commitment or
        financial advice. Consult with your loan officer for personalized guidance. Generated with AI assistance.
      </p>
      <p className="text-[10px] font-medium" style={{ color: `${TEXT}30` }}>
        Equal Housing Lender
      </p>
    </footer>
  )
}
