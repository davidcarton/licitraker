export default function Spinner() {
  return (
    <div style={{
      minHeight: '50vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16,
    }}>
      <div style={{
        width: 44, height: 44,
        borderRadius: '50%',
        border: '3px solid var(--g100)',
        borderTopColor: 'var(--g700)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--n700)' }}>
          Consultando licitaciones...
        </span>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--n300)' }}>
          Conectando con el Gobierno de España
        </span>
      </div>
    </div>
  )
}
