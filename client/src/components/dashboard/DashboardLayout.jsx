import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

export default function DashboardLayout({ title, filtros, children }) {
  const [collapsed, setCollapsed] = useState(false)
  const sw = collapsed ? 56 : 220

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div
        style={{
          marginLeft: sw,
          transition: 'margin-left 0.2s var(--ease)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Header title={title} sidebarWidth={sw} />
        {filtros && (
          <div style={{ paddingTop: 56 }}>
            {filtros}
          </div>
        )}
        <main
          style={{
            flex: 1,
            paddingTop: filtros ? 0 : 56,
            padding: filtros ? '0 clamp(1rem, 3vw, 2rem) 2rem' : '80px clamp(1rem, 3vw, 2rem) 2rem',
            maxWidth: 1400,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
