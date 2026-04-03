import { GOLD, TEXT, BORDER } from './constants'

export default function ShareFooter() {
  return (
    <footer className="pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
      <p className="text-[10px] leading-relaxed mb-2" style={{ color: `${TEXT}30` }}>
        This analysis is for informational purposes only and does not constitute a loan commitment or
        financial advice. Consult with your loan officer for personalized guidance. Equal Housing Lender.
      </p>
      <p className="text-[10px] font-medium" style={{ color: `${GOLD}40` }}>
        Powered by LoanOS
      </p>
    </footer>
  )
}
