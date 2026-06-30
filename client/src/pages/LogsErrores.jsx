import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw, AlertCircle, AlertTriangle, Info, Clock, Wifi, Globe } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NIVELES = {
  error: {
    bg: 'var(--rojo-bg)', color: 'var(--rojo)', border: 'var(--rojo-borde)',
    bgFila: '#FFF5F5', Icon: AlertCircle, label: 'Error',
  },
  warn: {
    bg: 'var(--ambar-bg)', color: 'var(--ambar)', border: 'var(--ambar-borde)',
    bgFila: '#FFFBF0', Icon: AlertTriangle, label: 'Aviso',
  },
  info: {
    bg: 'var(--g50)', color: 'var(--g700)', border: 'var(--g200)',
    bgFila: 'var(--gris-fondo)', Icon: Info, label: 'Info',
  },
}

const FILTROS = [
  { id: 'todos', label: 'Todos' },
  { id: 'error', label: 'Errores' },
  { id: 'warn', label: 'Avisos' },
  { id: 'info', label: 'Info' },
]

function NivelBadge({ nivel }) {
  const c = NIVELES[nivel] || NIVELES.info
  const { bg, color, border, Icon, label } = c
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 100,
      border: `1px solid ${border}`, background: bg, color,
      fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', lineHeight: 1, flexShrink: 0,
    }}>
      <Icon size={12} />
      {label}
    </span>
  )
}

function formatFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })
}

function StatCard({ label, valor, color, bg, border }) {
  return (
    <div style={{
      flex: 1, minWidth: 100,
      background: bg, border: `1px solid ${border}`,
      borderRadius: 'var(--r-lg)', padding: '14px 18px',
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: 'var(--font-titulo)', lineHeight: 1 }}>
        {valor}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  )
}

function FilaLog({ log }) {
  const c = NIVELES[log.nivel] || NIVELES.info

  return (
    <div style={{
      padding: '12px 16px', borderRadius: 'var(--r-md)',
      background: c.bgFila, border: `1px solid ${c.border}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <NivelBadge nivel={log.nivel} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--negro)', lineHeight: 1.4, wordBreak: 'break-word' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--n400)', marginRight: 6 }}>[{log.contexto}]</span>
            {log.mensaje}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--n400)' }}>
              <Clock size={10} />
              {formatFechaHora(log.fecha)}
            </span>

            {log.ms != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--n400)' }}>
                <Wifi size={10} />
                {log.ms} ms
              </span>
            )}

            {log.ip && log.ip !== '?' && log.ip !== '::1' && log.ip !== '127.0.0.1' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--n400)' }}>
                <Globe size={10} />
                {log.ip}
              </span>
            )}

            {log.status && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: log.status >= 500 ? 'var(--rojo)' : log.status >= 400 ? 'var(--ambar)' : 'var(--n400)',
              }}>
                HTTP {log.status}
              </span>
            )}

            {log.ua && (
              <span style={{ fontSize: 11, color: 'var(--n300)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
                {log.ua}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LogsErrores() {
  const { authFetch, usuario } = useAuth()
  const [logs, setLogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/logs')
      const datos = await res.json()
      if (!res.ok) { setError(datos.error || 'No se ha podido cargar el registro'); return }
      setLogs(datos.logs || [])
      setUltimaActualizacion(new Date())
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTraker · Logs y errores'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de logs al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') return <Navigate to="/dashboard" replace />

  const conteos = { error: 0, warn: 0, info: 0 }
  logs.forEach(l => { if (conteos[l.nivel] !== undefined) conteos[l.nivel]++ })

  const logsFiltrados = filtro === 'todos' ? logs : logs.filter(l => l.nivel === filtro)

  return (
    <DashboardLayout title="Logs y errores">
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-titulo)', fontSize: 20, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
            Registro de actividad
          </h1>
          {ultimaActualizacion && (
            <p style={{ fontSize: 12, color: 'var(--n400)', margin: '4px 0 0' }}>
              Actualizado {ultimaActualizacion.toLocaleTimeString('es-ES')} · {logs.length} entradas (máx. 500)
            </p>
          )}
        </div>
        <button
          onClick={cargar}
          disabled={cargando}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 'var(--r-md)',
            background: 'var(--verde)', color: '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
            opacity: cargando ? 0.7 : 1,
          }}
          onMouseEnter={(e) => !cargando && (e.currentTarget.style.background = 'var(--verde-medio)')}
          onMouseLeave={(e) => !cargando && (e.currentTarget.style.background = 'var(--verde)')}
        >
          <RefreshCw size={15} style={{ animation: cargando ? 'spin 0.8s linear infinite' : 'none' }} />
          Actualizar
        </button>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--rojo-bg)', border: '1px solid var(--rojo-borde)', color: 'var(--rojo)',
          borderRadius: 'var(--r-md)', padding: '12px 16px', fontSize: 13, fontWeight: 600,
          marginBottom: 20,
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatCard
          label="Errores"
          valor={conteos.error}
          color={NIVELES.error.color}
          bg={NIVELES.error.bg}
          border={NIVELES.error.border}
        />
        <StatCard
          label="Avisos"
          valor={conteos.warn}
          color={NIVELES.warn.color}
          bg={NIVELES.warn.bg}
          border={NIVELES.warn.border}
        />
        <StatCard
          label="Info"
          valor={conteos.info}
          color={NIVELES.info.color}
          bg={NIVELES.info.bg}
          border={NIVELES.info.border}
        />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--n100)', marginBottom: 16 }}>
        {FILTROS.map(f => {
          const activo = filtro === f.id
          const cuenta = f.id === 'todos' ? logs.length : conteos[f.id]
          return (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              style={{
                padding: '10px 16px', marginBottom: -1,
                fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
                color: activo ? 'var(--negro)' : 'var(--n400)',
                borderBottom: `2px solid ${activo ? 'var(--verde)' : 'transparent'}`,
                transition: 'color 0.15s, border-color 0.15s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {f.label}
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: activo ? 'var(--verde-claro)' : 'var(--n100)',
                color: activo ? 'var(--verde)' : 'var(--n400)',
                padding: '1px 6px', borderRadius: 100,
              }}>
                {cuenta}
              </span>
            </button>
          )
        })}
      </div>

      {/* Lista */}
      {cargando ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 24 }}>
          <div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid var(--n100)', borderTopColor: 'var(--verde)', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--n400)' }}>Cargando registros...</span>
        </div>
      ) : logsFiltrados.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--n400)', margin: 0 }}>
            {filtro === 'todos' ? 'No hay registros todavía. Todo funciona correctamente.' : `No hay entradas de tipo "${FILTROS.find(f => f.id === filtro)?.label}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {logsFiltrados.map((log, i) => <FilaLog key={i} log={log} />)}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </DashboardLayout>
  )
}
