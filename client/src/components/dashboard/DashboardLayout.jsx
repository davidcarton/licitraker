import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

export default function DashboardLayout({ title, filtros, children }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gris-fondo)' }}>
      <Sidebar abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />

      {/* Overlay oscuro para móvil */}
      {sidebarAbierto && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarAbierto(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 55,
          }}
        />
      )}

      <div className="dash-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Header title={title} onToggleSidebar={() => setSidebarAbierto(v => !v)} />

        {filtros}

        <main style={{ padding: '28px clamp(1rem, 3vw, 2.5rem)', flex: 1, maxWidth: 1400, width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>

      <style>{`
        .dash-content { margin-left: 200px; }
        @media (max-width: 1024px) {
          .dash-content { margin-left: 64px; }
        }
        @media (max-width: 640px) {
          .dash-content { margin-left: 0 !important; }
          .sidebar-overlay { display: block; }
        }
        @media (min-width: 641px) {
          .sidebar-overlay { display: none !important; }
        }
      `}</style>
    </div>
  )
}
