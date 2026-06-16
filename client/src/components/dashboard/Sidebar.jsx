import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/dashboard/licitaciones', label: 'Licitaciones', icon: FileText, end: false },
  { to: '/dashboard/configuracion', label: 'Configuración', icon: Settings, end: false },
]

export default function Sidebar() {
  return (
    <aside
      className="dash-sidebar"
      style={{
        width: 200,
        flexShrink: 0,
        background: '#1B2B1F',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 60,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '20px 16px',
          height: 56,
          boxSizing: 'border-box',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <polygon
            points="14,2 25,8 25,20 14,26 3,20 3,8"
            fill="none"
            stroke="var(--g500)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="14" r="3.5" fill="var(--g500)" />
        </svg>
        <span
          className="dash-sidebar-label"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          LiciTracker
        </span>
      </div>

      {/* Navegación */}
      <nav style={{ flex: 1, padding: '16px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              borderRadius: 'var(--r-md)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              borderLeft: isActive ? '3px solid #5A9A6E' : '3px solid transparent',
              background: isActive ? 'rgba(61,122,79,0.35)' : 'transparent',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
              transition: 'background var(--transition), color var(--transition)',
            })}
          >
            <Icon size={18} style={{ flexShrink: 0 }} />
            <span className="dash-sidebar-label" style={{ whiteSpace: 'nowrap' }}>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Avatar empresa */}
      <div
        style={{
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
        title="Constructora García"
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--verde-medio)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-titulo)',
            flexShrink: 0,
          }}
        >
          CG
        </div>
        <span
          className="dash-sidebar-label"
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.7)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          Constructora García
        </span>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dash-sidebar { width: 64px !important; }
          .dash-sidebar-label { display: none !important; }
          .dash-content { margin-left: 64px !important; }
        }
      `}</style>
    </aside>
  )
}
