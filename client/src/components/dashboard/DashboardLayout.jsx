import { useState } from 'react'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'
import '../../styles/components/dashboard/DashboardLayout.css'

export default function DashboardLayout({ title, filtros, children }) {
  const [sidebarAbierto, setSidebarAbierto] = useState(false)

  return (
    <div className="dash-layout">
      <Sidebar abierto={sidebarAbierto} onCerrar={() => setSidebarAbierto(false)} />

      {sidebarAbierto && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      <div className="dash-content">
        <Header title={title} onToggleSidebar={() => setSidebarAbierto(v => !v)} />

        {filtros}

        <main className="dash-main">{children}</main>
      </div>
    </div>
  )
}
