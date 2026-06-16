import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Building2, Bookmark, Send, Check } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import TablaUrgentes from '../components/dashboard/TablaUrgentes.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { diasRestantes, formatImporte } from '../utils/format.js'

function fechaLarga() {
  const f = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}

function TarjetaCompacta({ licitacion: l, accion }) {
  const dias = diasRestantes(l.fechaLimite)
  const importe = formatImporte(l.importe)
  const diasColor = dias === null ? 'var(--text-muted)' : dias < 3 ? 'var(--danger)' : dias <= 7 ? 'var(--warning)' : 'var(--brand)'

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-surface border border-border rounded-lg">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm text-ink truncate">{l.titulo || 'Sin título'}</p>
        <p className="text-xs text-ink-3 mt-0.5 flex gap-3">
          <span>{l.provincia || '—'}</span>
          <span>{importe ? `${importe} €` : 'Consultar'}</span>
          {dias !== null && <span style={{ color: diasColor, fontWeight: 600 }}>{dias}d</span>}
        </p>
      </div>
      {accion}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { licitacionesGuardadas, licitacionesPresentadas, marcarPresentada } = useApp()
  const [total, setTotal] = useState(0)
  const [panel, setPanel] = useState(null)

  const empresa = usuario?.empresa?.nombre || 'Tu empresa'

  useEffect(() => {
    document.title = 'LiciTraker · Dashboard'
    fetch('/api/licitaciones')
      .then(r => r.json())
      .then(d => setTotal(d.total || 0))
      .catch(() => {})
    return () => { document.title = 'LiciTraker' }
  }, [])

  const atencion = licitacionesGuardadas.filter(l => {
    const d = diasRestantes(l.fechaLimite)
    return d !== null && d >= 0 && d <= 7
  })
  const estadosAtencion = Object.fromEntries(
    atencion.map(l => [l.expediente, 'Guardada'])
  )

  return (
    <DashboardLayout title="Inicio">
      {/* Saludo */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-semibold text-ink" style={{ letterSpacing: '-0.02em' }}>
          {empresa}
        </h2>
        <p className="text-sm text-ink-3 mt-1">{fechaLarga()}</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
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
          onClick={() => setPanel(p => p === 'guardadas' ? null : 'guardadas')}
        />
        <KPICard
          icon={Send}
          value={licitacionesPresentadas.length}
          label="Ofertas presentadas"
          onClick={() => setPanel(p => p === 'presentadas' ? null : 'presentadas')}
        />
      </div>

      {/* Panel expandible */}
      <AnimatePresence>
        {panel && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden mb-8"
          >
            <h3 className="text-base font-semibold text-ink mb-4">
              {panel === 'guardadas' ? 'Licitaciones guardadas' : 'Ofertas presentadas'}
            </h3>
            <div className="space-y-2">
              {panel === 'guardadas' && (
                licitacionesGuardadas.length === 0
                  ? <p className="text-sm text-ink-3">Aún no has guardado ninguna licitación.</p>
                  : licitacionesGuardadas.map(l => (
                      <TarjetaCompacta
                        key={l.expediente}
                        licitacion={l}
                        accion={
                          <button
                            onClick={() => marcarPresentada(l.expediente)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-brand-light text-brand border border-brand-mid hover:bg-brand-mid transition-colors shrink-0"
                          >
                            <Check size={12} />
                            Marcar presentada
                          </button>
                        }
                      />
                    ))
              )}
              {panel === 'presentadas' && (
                licitacionesPresentadas.length === 0
                  ? <p className="text-sm text-ink-3">Aún no has marcado ninguna oferta como presentada.</p>
                  : licitacionesPresentadas.map(l => (
                      <TarjetaCompacta key={l.expediente} licitacion={l} />
                    ))
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Atención requerida */}
      {atencion.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-ink mb-1">Atención requerida</h3>
          <p className="text-sm text-ink-3 mb-4">Licitaciones guardadas con plazo próximo</p>
          <TablaUrgentes items={atencion} estados={estadosAtencion} onMarcarPresentada={marcarPresentada} />
        </section>
      )}
    </DashboardLayout>
  )
}
