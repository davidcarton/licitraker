import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

export default function DashboardLayout({ title, filtros, children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gris-fondo)' }}>
      <Sidebar />

      <div className="dash-content" style={{ marginLeft: 200, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header title={title} />

        {filtros}

        <main style={{ padding: '28px clamp(1rem, 3vw, 2.5rem)', flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
