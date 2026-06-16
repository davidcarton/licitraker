import { useAuth } from '../../context/AuthContext.jsx'

export default function Header({ title, sidebarWidth = 220 }) {
  const { usuario } = useAuth()
  const initials = usuario?.nombre
    ? usuario.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: sidebarWidth,
        right: 0,
        height: 56,
        zIndex: 20,
        background: 'rgba(250,250,249,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
        transition: 'left 0.2s var(--ease)',
      }}
    >
      <h1 style={{
        fontWeight: 600,
        fontSize: 15,
        color: 'var(--text-primary)',
        letterSpacing: '-0.015em',
        flexShrink: 0,
      }}>
        {title}
      </h1>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        {usuario?.nombre && (
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1 }}>
            {usuario.nombre}
          </p>
        )}
        <div style={{
          width: 30, height: 30,
          borderRadius: '50%',
          background: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.02em',
          flexShrink: 0,
        }}>
          {initials}
        </div>
      </div>
    </header>
  )
}
