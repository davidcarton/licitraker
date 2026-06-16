import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Bookmark, Send, Sparkles, Trash2 } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { diasRestantes, formatImporte } from '../utils/format.js'
import Badge from '../components/ui/Badge.jsx'

function fechaLarga() {
  const f = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}

function diasVariant(dias) {
  if (dias === null) return 'neutral'
  if (dias < 3) return 'urgente'
  if (dias <= 7) return 'proximo'
  return 'enplazo'
}

function TarjetaGuardada({ licitacion: l, onIA, onBorrar }) {
  const dias = diasRestantes(l.fechaLimite)
  const importe = formatImporte(l.importe)
  const [confirmando, setConfirmando] = useState(false)

  function handleBorrar() {
    if (confirmando) { onBorrar(); return }
    setConfirmando(true)
    setTimeout(() => setConfirmando(false), 2500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '14px 16px',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 600, fontSize: 13.5,
            color: 'var(--text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}>
            {l.titulo || 'Sin título'}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            {l.organismo || l.provincia || '—'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {dias !== null && (
            <Badge variant={diasVariant(dias)} showDot={false}>
              {dias < 0 ? 'Vencida' : `${dias}d`}
            </Badge>
          )}
          {importe && (
            <span style={{
              fontSize: 12, fontWeight: 600, color: 'var(--brand)',
              fontFamily: 'var(--font-mono)',
            }}>
              {importe} €
            </span>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={onIA}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 7,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: 'linear-gradient(135deg, #2A5938 0%, #3d9465 100%)',
            color: 'white', border: 'none',
            boxShadow: '0 2px 8px rgba(42,89,56,0.30)',
            transition: 'opacity 0.15s, transform 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }}
        >
          <Sparkles size={12} />
          Resumen IA
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={handleBorrar}
          title={confirmando ? 'Haz clic de nuevo para confirmar' : 'Quitar licitación'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '6px 10px', borderRadius: 7,
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            background: confirmando ? 'var(--danger-light)' : 'transparent',
            color: confirmando ? 'var(--danger)' : 'var(--text-muted)',
            border: `1px solid ${confirmando ? 'var(--danger-border)' : 'var(--border)'}`,
            transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => {
            if (!confirmando) {
              e.currentTarget.style.background = 'var(--danger-light)'
              e.currentTarget.style.color = 'var(--danger)'
              e.currentTarget.style.borderColor = 'var(--danger-border)'
            }
          }}
          onMouseLeave={e => {
            if (!confirmando) {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border)'
            }
          }}
        >
          <Trash2 size={12} />
          {confirmando ? 'Confirmar' : 'Quitar'}
        </button>
      </div>
    </motion.div>
  )
}

function TarjetaPresentada({ licitacion: l }) {
  const dias = l.fechaLimite
    ? Math.ceil((new Date(l.fechaLimite) - new Date()) / 86400000)
    : null
  const importe = formatImporte(l.importe)

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 8, height: 8, borderRadius: '50%',
        background: 'var(--success)', flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {l.titulo || 'Sin título'}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {l.provincia || '—'}{importe ? ` · ${importe} €` : ''}
        </p>
      </div>
      {dias !== null && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'var(--font-mono)' }}>
          {dias < 0 ? 'Vencida' : `${dias}d`}
        </span>
      )}
    </div>
  )
}

function SeccionVacia({ texto }) {
  return (
    <div style={{
      padding: '28px 20px',
      textAlign: 'center',
      background: 'var(--bg-subtle)',
      borderRadius: 12,
      border: '1px dashed var(--border-strong)',
    }}>
      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{texto}</p>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { licitacionesGuardadas, licitacionesPresentadas, quitarLicitacion } = useApp()
  const [total, setTotal] = useState(0)

  const empresa = usuario?.empresa?.nombre || 'Tu empresa'

  useEffect(() => {
    document.title = 'LiciTraker · Dashboard'
    fetch('/api/licitaciones')
      .then(r => r.json())
      .then(d => setTotal(d.total || 0))
      .catch(() => {})
    return () => { document.title = 'LiciTraker' }
  }, [])

  const guardadasOrdenadas = [...licitacionesGuardadas].sort((a, b) => {
    const da = diasRestantes(a.fechaLimite)
    const db_ = diasRestantes(b.fechaLimite)
    if (da === null && db_ === null) return 0
    if (da === null) return 1
    if (db_ === null) return -1
    return da - db_
  })

  function irAResumenIA(licitacion) {
    navigate('/dashboard/resumen', { state: { licitacion } })
  }

  return (
    <DashboardLayout title="Inicio">
      {/* Saludo */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: 24 }}
      >
        <h2 style={{
          fontSize: 22, fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em', lineHeight: 1.2,
        }}>
          {empresa}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {fechaLarga()}
        </p>
      </motion.div>

      {/* KPIs */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 36,
      }}>
        <KPICard
          icon={Building2}
          value={total}
          label="Licitaciones activas"
          onClick={() => navigate('/dashboard/licitaciones')}
        />
        <KPICard
          icon={Bookmark}
          value={licitacionesGuardadas.length}
          label="Guardadas"
        />
        <KPICard
          icon={Send}
          value={licitacionesPresentadas.length}
          label="Presentadas"
        />
      </div>

      {/* Guardadas */}
      <section style={{ marginBottom: 36 }}>
        <SectionHeader
          title="Licitaciones guardadas"
          subtitle="Ordenadas por urgencia — las más próximas al vencimiento primero"
          count={licitacionesGuardadas.length}
        />
        {guardadasOrdenadas.length === 0 ? (
          <SeccionVacia texto="Aún no has guardado ninguna licitación. Ve a Licitaciones para explorar y guardar." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {guardadasOrdenadas.map(l => (
              <TarjetaGuardada
                key={l.expediente}
                licitacion={l}
                onIA={() => irAResumenIA(l)}
                onBorrar={() => quitarLicitacion(l.expediente)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Presentadas */}
      {licitacionesPresentadas.length > 0 && (
        <section>
          <SectionHeader
            title="Ofertas presentadas"
            subtitle="Licitaciones donde ya has entregado documentación"
            count={licitacionesPresentadas.length}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {licitacionesPresentadas.map(l => (
              <TarjetaPresentada key={l.expediente} licitacion={l} />
            ))}
          </div>
        </section>
      )}
    </DashboardLayout>
  )
}

function SectionHeader({ title, subtitle, count }) {
  return (
    <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.015em' }}>
            {title}
          </h3>
          {count > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: 'var(--brand-light)',
              color: 'var(--brand)',
              border: '1px solid var(--brand-mid)',
              borderRadius: 20, padding: '1px 7px',
            }}>
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
    </div>
  )
}
