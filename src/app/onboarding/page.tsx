export default function OnboardingPage() {
  return (
    <main
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060b18',
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div style={{ textAlign: 'center', color: '#e2e8f0' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Loan<span style={{ color: '#C9A84C' }}>OS</span>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '1rem' }}>
          Your account isn&apos;t linked to an organization yet.
        </p>
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
          Contact your administrator to be added.
        </p>
      </div>
    </main>
  )
}
