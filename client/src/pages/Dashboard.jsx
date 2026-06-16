import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Bookmark, Send, Check } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import TablaUrgentes from '../components/dashboard/TablaUrgentes.jsx'
import { useApp } from '../context/AppContext.jsx'
import { diasRestantes, formatImporte } from '../utils/format.js'

const EMPRESA = 'Constructora García'

function fechaLarga() {
  const f = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}

function DiasTexto({ dias }) {
  if (dias === null) return <span style={{ color: 'var(--n300)' }}>Sin plazo</span>
  const color = dias < 3 ? 'var(--rojo)' : dias <= 7 ? 'var(--ambar)' : 'var(--g700)'
  return <span style={{ color, fontWeight: 700 }}>{dias}d</span>
}

function TarjetaCompacta({ licitacion, accion }) {
  const dias = diasRestantes(licitacion.fechaLimite)
  const importe = formatImporte(licitacion.importe)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '12px 16px', background: '#fff',
      border: '1px solid var(--n100)', borderRadius: 'var(--r-md)',
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          fontFamily: 'var(--font-titulo)', fontWeight: 700, fontSize: 13, color: 'var(--negro)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {licitacion.titulo || 'Sin título'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--n400)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span>{licitacion.provincia || '—'}</span>
          <span>{importe ? `${importe} €` : 'Consultar'}</span>
          <DiasTexto dias={dias} />
        </div>
      </div>
      {accion}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { licitacionesGuardadas, licitacionesPresentadas, marcarPresentada } = useApp()
  const [total, setTotal] = useState(0)
  const [panel, setPanel] = useState(null)

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Dashboard'

    fetch('/api/licitaciones')
      .then(res => res.json())
      .then(data => setTotal(data.total || 0))
      .catch(() => {})

    return () => { document.title = tituloPrevio }
  }, [])

  const atencion = licitacionesGuardadas.filter(l => {
    const d = diasRestantes(l.fechaLimite)
    return d !== null && d >= 0 && d <= 7
  })
  const estadosAtencion = Object.fromEntries(atencion.map(l => [l.expediente, 'Guardada']))

  const togglePanel = (nombre) => setPanel(prev => (prev === nombre ? null : nombre))

  return (
    <DashboardLayout title="Inicio">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2 style={{ fontFamily: 'var(--font-titulo)', fontSize: 24, fontWeight: 700, color: '#000', margin: 0 }}>
          {EMPRESA}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 4 }}>
          {fechaLarga()}
        </p>
      </motion.div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginTop: 24,
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
          label="Licitaciones guardadas"
          onClick={() => togglePanel('guardadas')}
        />
        <KPICard
          icon={Send}
          value={licitacionesPresentadas.length}
          label="Ofertas presentadas"
          onClick={() => togglePanel('presentadas')}
        />
      </div>

      <AnimatePresence>
        {panel && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ marginTop: 24, overflow: 'hidden' }}
          >
            <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 17, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
              {panel === 'guardadas' ? 'Licitaciones guardadas' : 'Ofertas presentadas'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
              {panel === 'guardadas' && (
                licitacionesGuardadas.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--n400)' }}>
                    Aún no has guardado ninguna licitación. Ve a Licitaciones para explorar y guardar las que te interesen.
                  </p>
                ) : licitacionesGuardadas.map(l => (
                  <TarjetaCompacta
                    key={l.expediente}
                    licitacion={l}
                    accion={(
                      <button
                        onClick={() => marcarPresentada(l.expediente)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                          padding: '7px 12px',
                          borderRadius: 'var(--r-md)',
                          border: '1px solid var(--g200)',
                          background: 'var(--verde-claro)',
                          color: 'var(--verde)',
                          fontSize: 12, fontWeight: 700,
                          fontFamily: 'var(--font-body)',
                          transition: 'background var(--transition)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--g200)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--verde-claro)')}
                      >
                        <Check size={13} />
                        Marcar como presentada
                      </button>
                    )}
                  />
                ))
              )}

              {panel === 'presentadas' && (
                licitacionesPresentadas.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--n400)' }}>
                    Aún no has marcado ninguna oferta como presentada.
                  </p>
                ) : licitacionesPresentadas.map(l => (
                  <TarjetaCompacta key={l.expediente} licitacion={l} />
                ))
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {atencion.length > 0 && (
        <section style={{ marginTop: 36 }}>
          <h3 style={{
            fontFamily: 'var(--font-titulo)', fontSize: 17, fontWeight: 700,
            color: 'var(--negro)', margin: 0,
          }}>
            Atención requerida
          </h3>
          <p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 4, marginBottom: 16 }}>
            Licitaciones guardadas con plazo próximo
          </p>
          <TablaUrgentes items={atencion} estados={estadosAtencion} onMarcarPresentada={marcarPresentada} />
        </section>
      )}
    </DashboardLayout>
  )
}
