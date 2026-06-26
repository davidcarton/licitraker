import { Search, Bell, Plus, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { iniciales } from '../../utils/format.js'

export default function Header({ title, onToggleSidebar }) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const nombreEmpresa = usuario?.empresa?.nombre || 'Mi empresa'

  return (
    <header
      className="dash-header"
      style={{
        height: 56,
        flexShrink: 0,
        background: '#1B2B1F',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 clamp(1rem, 3vw, 1.75rem)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Botón hamburguesa — solo móvil */}
      <button
        className="dash-header-hamburger"
        aria-label="Abrir menú"
        onClick={onToggleSidebar}
        style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.08)',
          flexShrink: 0,
          transition: 'background var(--transition)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      >
        <Menu size={18} color="#fff" />
      </button>

      <h1
        style={{
          fontFamily: 'var(--font-titulo)',
          fontSize: 15,
          fontWeight: 600,
          color: '#fff',
          margin: 0,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {title}
      </h1>

      <div className="dash-header-buscador" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 360, maxWidth: '100%' }}>
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.5)', pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Buscar..."
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 13,
            }}
          />
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button
          aria-label="Notificaciones"
          style={{
            position: 'relative',
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.08)',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
        >
          <Bell size={17} color="#fff" />
        </button>

        <button
          className="dash-header-alerta"
          onClick={() => navigate('/dashboard/configuracion')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#3D7A4F',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'var(--font-body)',
            whiteSpace: 'nowrap',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--verde)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#3D7A4F')}
        >
          <Plus size={15} />
          Nueva alerta
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
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
            {iniciales(nombreEmpresa)}
          </div>
          <span
            className="dash-header-empresa"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              whiteSpace: 'nowrap',
            }}
          >
            {nombreEmpresa}
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .dash-header-empresa, .dash-header-alerta { display: none !important; }
        }
        @media (max-width: 680px) {
          .dash-header-buscador { display: none !important; }
        }
        @media (max-width: 640px) {
          .dash-header-hamburger { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
