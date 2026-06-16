import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Building2, Bookmark, Send, Trash2, Sparkles, Check, X } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import { useApp } from '../context/AppContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { diasRestantes, formatImporte } from '../utils/format.js'

function fechaLarga() {
  const f = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
  return f.charAt(0).toUpperCase() + f.slice(1)
}

// ─── Botón de acción pequeño ──────────────────────────────────────────────────

function BtnAccion({ onClick, color, bgHover, icon, label }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 10px',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--n100)',
        background: hov ? (bgHover || 'var(--n50)') : '#fff',
        color,
        fontSize: 11, fontWeight: 700,
        fontFamily: 'var(--font-body)',
        transition: 'background var(--transition)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {icon}
      {label}
    </button>
  )
}

// ─── Badge de estado presentada ───────────────────────────────────────────────

function EstadoBadge({ estado }) {
  const cfg = {
    aceptada:  { bg: 'var(--g100)',    color: 'var(--g800)',  label: 'Aceptada'  },
    denegada:  { bg: 'var(--rojo-bg)', color: 'var(--rojo)',  label: 'Denegada'  },
    presentada:{ bg: 'var(--n50)',     color: 'var(--n500)',  label: 'Sin resultado' },
  }
  const c = cfg[estado] || cfg.presentada
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100,
      background: c.bg, color: c.color,
      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-body)',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {c.label}
    </span>
  )
}

// ─── Fila: licitación guardada ────────────────────────────────────────────────

function FilaGuardada({ licitacion: l, onIA, onEliminar, onPresentada }) {
  const dias = diasRestantes(l.fechaLimite)
  const importe = formatImporte(l.importe)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', background: '#fff',
      border: '1px solid var(--n100)', borderRadius: 'var(--r-md)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-titulo)', fontWeight: 600, fontSize: 13,
          color: 'var(--negro)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {l.titulo || 'Sin título'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--n400)', marginTop: 3, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {l.organismo && <span>{l.organismo}</span>}
          {importe && <span>{importe} €</span>}
          {dias !== null && (
            <span style={{
              fontWeight: 700,
              color: dias < 3 ? 'var(--rojo)' : dias <= 7 ? 'var(--ambar)' : 'var(--g700)',
            }}>
              {dias}d restantes
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <BtnAccion onClick={onIA} color="var(--g700)" bgHover="var(--g50)" icon={<Sparkles size={13} />} label="Resumen IA" />
        <BtnAccion onClick={onEliminar} color="var(--rojo)" bgHover="var(--rojo-bg)" icon={<Trash2 size={13} />} label="Eliminar" />
        <BtnAccion onClick={onPresentada} color="var(--n500)" icon={<Check size={13} />} label="Presentada" />
      </div>
    </div>
  )
}

// ─── Fila: oferta presentada ──────────────────────────────────────────────────

function FilaPresentada({ licitacion: l, onAceptada, onDenegada }) {
  const importe = formatImporte(l.importe)
  const resuelta = l.estado === 'aceptada' || l.estado === 'denegada'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', background: '#fff',
      border: '1px solid var(--n100)', borderRadius: 'var(--r-md)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-titulo)', fontWeight: 600, fontSize: 13,
          color: 'var(--negro)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {l.titulo || 'Sin título'}
        </div>
        <div style={{ fontSize: 11, color: 'var(--n400)', marginTop: 3, display: 'flex', gap: 10 }}>
          {l.organismo && <span>{l.organismo}</span>}
          {importe && <span>{importe} €</span>}
        </div>
      </div>

      <EstadoBadge estado={l.estado} />

      {!resuelta && (
        <div style={{ display: 'flex', gap: 6 }}>
          <BtnAccion onClick={onAceptada} color="var(--g700)" bgHover="var(--g50)" icon={<Check size={13} />} label="Aceptada" />
          <BtnAccion onClick={onDenegada} color="var(--rojo)" bgHover="var(--rojo-bg)" icon={<X size={13} />} label="Denegada" />
        </div>
      )}
    </div>
  )
}

// ─── Gráfica de resultados ────────────────────────────────────────────────────

function GraficaResultados({ presentadas }) {
  const aceptadas = presentadas.filter(l => l.estado === 'aceptada').length
  const denegadas = presentadas.filter(l => l.estado === 'denegada').length
  const pendientes = presentadas.filter(l => l.estado === 'presentada').length
  const total = presentadas.length

  // Agrupar por mes usando fechaResolucion (updated_at)
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

  const meses = Object.keys(byMonth).sort().slice(-6)
  const hayMensual = meses.length > 1
  const maxVal = hayMensual
    ? Math.max(...meses.map(m => byMonth[m].aceptadas + byMonth[m].denegadas), 1)
    : 1

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--n100)',
      borderRadius: 'var(--r-xl)', padding: '20px 24px',
      alignSelf: 'start',
    }}>
      <div style={{ fontFamily: 'var(--font-titulo)', fontSize: 14, fontWeight: 700, color: 'var(--negro)', marginBottom: 18 }}>
        Resultados
      </div>

      {/* Números resumen */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
        {[
          { n: aceptadas, label: 'Aceptadas', color: 'var(--g700)' },
          { n: denegadas, label: 'Denegadas', color: 'var(--rojo)' },
          { n: pendientes, label: 'Sin resultado', color: 'var(--n400)' },
        ].map(({ n, label, color }) => (
          <div key={label}>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-titulo)', color, lineHeight: 1 }}>{n}</div>
            <div style={{ fontSize: 11, color: 'var(--n400)', marginTop: 4, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Barra proporcional */}
      {total > 0 && (
        <div style={{ height: 8, borderRadius: 4, background: 'var(--n100)', overflow: 'hidden', display: 'flex', marginBottom: 20 }}>
          {aceptadas > 0 && (
            <div style={{ width: `${(aceptadas / total) * 100}%`, background: 'var(--g500)', transition: 'width 0.5s ease' }} />
          )}
          {denegadas > 0 && (
            <div style={{ width: `${(denegadas / total) * 100}%`, background: 'var(--rojo)', transition: 'width 0.5s ease' }} />
          )}
        </div>
      )}

      {/* Gráfica mensual */}
      {hayMensual && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--n300)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            Por mes
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 72 }}>
            {meses.map(m => {
              const { label, aceptadas: a, denegadas: d } = byMonth[m]
              const hA = Math.round((a / maxVal) * 52)
              const hD = Math.round((d / maxVal) * 52)
              return (
                <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 54 }}>
                    <div style={{ width: 10, height: Math.max(hA, 2), background: 'var(--g500)', borderRadius: '2px 2px 0 0' }} />
                    <div style={{ width: 10, height: Math.max(hD, 2), background: 'var(--rojo)', borderRadius: '2px 2px 0 0' }} />
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--n300)', fontFamily: 'var(--font-body)', textAlign: 'center' }}>
                    {label}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
            {[{ color: 'var(--g500)', label: 'Aceptadas' }, { color: 'var(--rojo)', label: 'Denegadas' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 10, color: 'var(--n400)' }}>{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

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
      {/* Cabecera */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h2 style={{ fontFamily: 'var(--font-titulo)', fontSize: 24, fontWeight: 700, color: '#000', margin: 0 }}>
          {nombreEmpresa}
        </h2>
        <p style={{ fontSize: 13, color: 'var(--n400)', marginTop: 4 }}>{fechaLarga()}</p>
      </motion.div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 24 }}>
        <KPICard icon={Building2} value={total} label="Licitaciones activas" onClick={() => navigate('/dashboard/licitaciones')} />
        <KPICard icon={Bookmark} value={licitacionesGuardadas.length} label="Licitaciones guardadas" />
        <KPICard icon={Send} value={licitacionesPresentadas.length} label="Ofertas presentadas" />
      </div>

      {/* ── Guardadas ── */}
      <section style={{ marginTop: 36 }}>
        <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 16, fontWeight: 700, color: 'var(--negro)', margin: '0 0 12px 0' }}>
          Licitaciones guardadas
        </h3>
        {licitacionesGuardadas.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--n400)', padding: '12px 0' }}>
            Aún no has guardado ninguna licitación. Ve a Licitaciones para explorar y guardar las que te interesen.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

      {/* ── Presentadas ── */}
      <section style={{ marginTop: 36 }}>
        <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 16, fontWeight: 700, color: 'var(--negro)', margin: '0 0 12px 0' }}>
          Ofertas presentadas
        </h3>
        {licitacionesPresentadas.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--n400)', padding: '12px 0' }}>
            Aún no has marcado ninguna oferta como presentada.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 280px', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
