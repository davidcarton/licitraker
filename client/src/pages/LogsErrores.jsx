import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw, AlertCircle, AlertTriangle, Info, Clock, Wifi, Globe } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/pages/LogsErrores.css'

const NIVELES = {
  error: { Icon: AlertCircle,   label: 'Error' },
  warn:  { Icon: AlertTriangle, label: 'Aviso' },
  info:  { Icon: Info,          label: 'Info'  },
}

const FILTROS = [
  { id: 'todos',  label: 'Todos'   },
  { id: 'error',  label: 'Errores' },
  { id: 'warn',   label: 'Avisos'  },
  { id: 'info',   label: 'Info'    },
]

function NivelBadge({ nivel }) {
  const c = NIVELES[nivel] || NIVELES.info
  return (
    <span className={`le-nivel-badge le-nivel-badge--${nivel || 'info'}`}>
      <c.Icon size={12} />
      {c.label}
    </span>
  )
}

function formatFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })
}

function statusClase(status) {
  if (!status) return null
  if (status >= 500) return 'le-status--error'
  if (status >= 400) return 'le-status--warn'
  return 'le-status--normal'
}

function StatCard({ nivel, valor }) {
  return (
    <div className={`le-stat-card le-stat-card--${nivel}`}>
      <div className="le-stat-card__valor">{valor}</div>
      <div className="le-stat-card__label">{NIVELES[nivel]?.label}</div>
    </div>
  )
}

function FilaLog({ log }) {
  return (
    <div className={`le-fila-log le-fila-log--${log.nivel || 'info'}`}>
      <div className="le-fila-log__inner">
        <NivelBadge nivel={log.nivel} />
        <div className="le-fila-log__cuerpo">
          <div className="le-fila-log__mensaje">
            <span className="le-fila-log__contexto">[{log.contexto}]</span>
            {log.mensaje}
          </div>

          <div className="le-fila-log__meta">
            <span className="le-fila-log__meta-item">
              <Clock size={10} />
              {formatFechaHora(log.fecha)}
            </span>

            {log.ms != null && (
              <span className="le-fila-log__meta-item">
                <Wifi size={10} />
                {log.ms} ms
              </span>
            )}

            {log.ip && log.ip !== '?' && log.ip !== '::1' && log.ip !== '127.0.0.1' && (
              <span className="le-fila-log__meta-item">
                <Globe size={10} />
                {log.ip}
              </span>
            )}

            {log.status && (
              <span className={statusClase(log.status)}>HTTP {log.status}</span>
            )}

            {log.ua && <span className="le-fila-log__ua">{log.ua}</span>}
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
      <div className="le-cabecera">
        <div>
          <h1 className="le-titulo">Registro de actividad</h1>
          {ultimaActualizacion && (
            <p className="le-subtitulo">
              Actualizado {ultimaActualizacion.toLocaleTimeString('es-ES')} · {logs.length} entradas (máx. 500)
            </p>
          )}
        </div>
        <button onClick={cargar} disabled={cargando} className="le-btn-actualizar">
          <RefreshCw size={15} className={cargando ? 'spin-icon' : ''} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="le-error-banner">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="le-stats">
        <StatCard nivel="error" valor={conteos.error} />
        <StatCard nivel="warn"  valor={conteos.warn}  />
        <StatCard nivel="info"  valor={conteos.info}  />
      </div>

      <div className="le-tabs">
        {FILTROS.map(f => {
          const activo = filtro === f.id
          const cuenta = f.id === 'todos' ? logs.length : conteos[f.id]
          return (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`le-tab${activo ? ' le-tab--activo' : ''}`}
            >
              {f.label}
              <span className="le-tab__count">{cuenta}</span>
            </button>
          )
        })}
      </div>

      {cargando ? (
        <div className="le-spinner-wrap">
          <div className="le-spinner" />
          <span className="le-spinner-text">Cargando registros...</span>
        </div>
      ) : logsFiltrados.length === 0 ? (
        <div className="le-vacio">
          <p className="le-vacio__texto">
            {filtro === 'todos'
              ? 'No hay registros todavía. Todo funciona correctamente.'
              : `No hay entradas de tipo "${FILTROS.find(f => f.id === filtro)?.label}".`}
          </p>
        </div>
      ) : (
        <div className="le-lista">
          {logsFiltrados.map((log, i) => <FilaLog key={i} log={log} />)}
        </div>
      )}
    </DashboardLayout>
  )
}
