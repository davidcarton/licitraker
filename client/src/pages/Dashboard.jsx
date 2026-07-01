import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Bookmark, Send, Trash2, Sparkles, Check, X } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { diasRestantes, formatImporte, formatFechaLarga } from '../utils/format.js'
import '../styles/pages/Dashboard.css'

function BtnAccion({ onClick, color, bgHover, icon, label }) {
  return (
    <button
      onClick={onClick}
      className="db-btn-accion"
      style={{ '--btn-color': color, '--btn-bg-hover': bgHover }}
    >
      {icon}
      {label}
    </button>
  )
}

function EstadoBadge({ estado }) {
  const etiqueta = { aceptada: 'Aceptada', denegada: 'Denegada', presentada: 'Sin resultado' }
  const variante = estado === 'aceptada' || estado === 'denegada' ? estado : 'presentada'
  return (
    <span className={`db-estado-badge db-estado-badge--${variante}`}>
      {etiqueta[variante]}
    </span>
  )
}

function diasClase(dias) {
  if (dias < 3)  return 'db-dias db-dias--urgente'
  if (dias <= 7) return 'db-dias db-dias--proximo'
  return 'db-dias db-dias--plazo'
}

function FilaGuardada({ licitacion: l, onIA, onEliminar, onPresentada }) {
  const dias = diasRestantes(l.fechaLimite)
  const importe = formatImporte(l.importe)

  return (
    <div className="db-fila">
      <div className="db-fila__info">
        <div className="db-fila__titulo">{l.titulo || 'Sin título'}</div>
        <div className="db-fila__meta">
          {l.organismo && <span>{l.organismo}</span>}
          {importe && <span>{importe} €</span>}
          {dias !== null && (
            <span className={diasClase(dias)}>{dias}d restantes</span>
          )}
        </div>
      </div>
      <div className="db-fila__acciones">
        <BtnAccion onClick={onIA} color="var(--g700)" bgHover="var(--g50)" icon={<Sparkles size={13} />} label="Resumen IA" />
        <BtnAccion onClick={onEliminar} color="var(--rojo)" bgHover="var(--rojo-bg)" icon={<Trash2 size={13} />} label="Eliminar" />
        <BtnAccion onClick={onPresentada} color="var(--n500)" icon={<Check size={13} />} label="Presentada" />
      </div>
    </div>
  )
}

function FilaPresentada({ licitacion: l, onAceptada, onDenegada }) {
  const importe = formatImporte(l.importe)
  const resuelta = l.estado === 'aceptada' || l.estado === 'denegada'

  return (
    <div className="db-fila">
      <div className="db-fila__info">
        <div className="db-fila__titulo">{l.titulo || 'Sin título'}</div>
        <div className="db-fila__meta">
          {l.organismo && <span>{l.organismo}</span>}
          {importe && <span>{importe} €</span>}
        </div>
      </div>

      <EstadoBadge estado={l.estado} />

      {!resuelta && (
        <div className="db-fila__acciones">
          <BtnAccion onClick={onAceptada} color="var(--g700)" bgHover="var(--g50)" icon={<Check size={13} />} label="Aceptada" />
          <BtnAccion onClick={onDenegada} color="var(--rojo)" bgHover="var(--rojo-bg)" icon={<X size={13} />} label="Denegada" />
        </div>
      )}
    </div>
  )
}

function GraficaResultados({ presentadas }) {
  const aceptadas  = presentadas.filter(l => l.estado === 'aceptada').length
  const denegadas  = presentadas.filter(l => l.estado === 'denegada').length
  const pendientes = presentadas.filter(l => l.estado === 'presentada').length
  const total      = presentadas.length

  const byMonth = {}
  presentadas.forEach(l => {
    if (l.estado !== 'aceptada' && l.estado !== 'denegada') return
    if (!l.fechaResolucion) return
    const d = new Date(l.fechaResolucion)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('es-ES', { month: 'short', year: '2-digit' })
    if (!byMonth[key]) byMonth[key] = { label, aceptadas: 0, denegadas: 0 }
    if (l.estado === 'aceptada') byMonth[key].aceptadas++
    else byMonth[key].denegadas++
  })

  const meses  = Object.keys(byMonth).sort().slice(-6)
  const hayMensual = meses.length > 1
  const maxVal = hayMensual
    ? Math.max(...meses.map(m => byMonth[m].aceptadas + byMonth[m].denegadas), 1)
    : 1

  return (
    <div className="db-grafica">
      <div className="db-grafica__titulo">Resultados</div>

      <div className="db-resumen-nums">
        <div>
          <div className="db-resumen-num db-resumen-num--aceptada">{aceptadas}</div>
          <div className="db-resumen-label">Aceptadas</div>
        </div>
        <div>
          <div className="db-resumen-num db-resumen-num--denegada">{denegadas}</div>
          <div className="db-resumen-label">Denegadas</div>
        </div>
        <div>
          <div className="db-resumen-num db-resumen-num--pendiente">{pendientes}</div>
          <div className="db-resumen-label">Sin resultado</div>
        </div>
      </div>

      {total > 0 && (
        <div className="db-barra-prop">
          {aceptadas > 0 && (
            <div className="db-barra-prop__seg-aceptada" style={{ '--pct': `${(aceptadas / total) * 100}%` }} />
          )}
          {denegadas > 0 && (
            <div className="db-barra-prop__seg-denegada" style={{ '--pct': `${(denegadas / total) * 100}%` }} />
          )}
        </div>
      )}

      {hayMensual && (
        <>
          <div className="db-mensual-titulo">Por mes</div>
          <div className="db-mensual-wrap">
            {meses.map(m => {
              const { label, aceptadas: a, denegadas: d } = byMonth[m]
              const hA = Math.max(Math.round((a / maxVal) * 52), 2)
              const hD = Math.max(Math.round((d / maxVal) * 52), 2)
              return (
                <div key={m} className="db-mes-col">
                  <div className="db-mes-barras">
                    <div className="db-mes-barra db-mes-barra--aceptada" style={{ '--h': `${hA}px` }} />
                    <div className="db-mes-barra db-mes-barra--denegada" style={{ '--h': `${hD}px` }} />
                  </div>
                  <div className="db-mes-label">{label}</div>
                </div>
              )
            })}
          </div>
          <div className="db-leyenda">
            {[
              { cls: 'db-mes-barra--aceptada', label: 'Aceptadas' },
              { cls: 'db-mes-barra--denegada', label: 'Denegadas' },
            ].map(({ cls, label }) => (
              <div key={label} className="db-leyenda-item">
                <div className={`db-leyenda-dot ${cls}`} />
                <span className="db-leyenda-text">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { licitacionesGuardadas, licitacionesPresentadas, quitarLicitacion, marcarPresentada, marcarAceptada, marcarDenegada } = useApp()
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Dashboard'
    fetch('/api/licitaciones')
      .then(res => res.json())
      .then(data => setTotal(data.total || 0))
      .catch(() => {})
    return () => { document.title = tituloPrevio }
  }, [])

  const nombreEmpresa = usuario?.empresa?.nombre || 'Mi empresa'

  return (
    <DashboardLayout title="Inicio">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h2 className="db-titulo">{nombreEmpresa}</h2>
        <p className="db-fecha">{formatFechaLarga()}</p>
      </motion.div>

      <div className="db-kpi-grid">
        <KPICard icon={Building2} value={total} label="Licitaciones activas" onClick={() => navigate('/dashboard/licitaciones')} />
        <KPICard icon={Bookmark} value={licitacionesGuardadas.length} label="Licitaciones guardadas" />
        <KPICard icon={Send} value={licitacionesPresentadas.length} label="Ofertas presentadas" />
      </div>

      <section className="db-seccion">
        <h3 className="db-seccion__titulo">Licitaciones guardadas</h3>
        {licitacionesGuardadas.length === 0 ? (
          <p className="db-seccion__vacio">
            Aún no has guardado ninguna licitación. Ve a Licitaciones para explorar y guardar las que te interesen.
          </p>
        ) : (
          <div className="db-lista-col">
            {licitacionesGuardadas.map(l => (
              <FilaGuardada
                key={l.expediente}
                licitacion={l}
                onIA={() => navigate('/dashboard/resumen', { state: { licitacion: l } })}
                onEliminar={() => quitarLicitacion(l.expediente)}
                onPresentada={() => marcarPresentada(l.expediente)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="db-seccion">
        <h3 className="db-seccion__titulo">Ofertas presentadas</h3>
        {licitacionesPresentadas.length === 0 ? (
          <p className="db-seccion__vacio">
            Aún no has marcado ninguna oferta como presentada.
          </p>
        ) : (
          <div className="db-presentadas-grid">
            <div className="db-lista-col">
              {licitacionesPresentadas.map(l => (
                <FilaPresentada
                  key={l.expediente}
                  licitacion={l}
                  onAceptada={() => marcarAceptada(l.expediente)}
                  onDenegada={() => marcarDenegada(l.expediente)}
                />
              ))}
            </div>
            <GraficaResultados presentadas={licitacionesPresentadas} />
          </div>
        )}
      </section>
    </DashboardLayout>
  )
}
