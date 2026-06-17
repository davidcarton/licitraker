import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { RefreshCw, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const NIVEL_CONFIG = {
  error: { bg: 'var(--rojo-bg)', color: 'var(--rojo)', border: 'var(--rojo-borde)', Icon: AlertCircle, label: 'Error' },
  warn: { bg: 'var(--ambar-bg)', color: 'var(--ambar)', border: 'var(--ambar-borde)', Icon: AlertTriangle, label: 'Aviso' },
  info: { bg: 'var(--g50)', color: 'var(--g700)', border: 'var(--g200)', Icon: Info, label: 'Info' },
}

function NivelBadge({ nivel }) {
  const c = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.info
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

export default function LogsErrores() {
  const { authFetch, usuario } = useAuth()
  const [logs, setLogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/logs')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido cargar el registro de actividad')
        return
      }
      setLogs(datos.logs || [])
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Logs y errores'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de logs al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Logs y errores">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button
          onClick={cargar}
          disabled={cargando}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 'var(--r-md)',
            background: 'var(--verde)', color: '#fff',
            fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)',
            opacity: cargando ? 0.7 : 1,
            transition: 'background var(--transition), opacity var(--transition)',
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

      <section style={{
        background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)',
        boxShadow: 'var(--shadow-card)', padding: '22px 24px',
      }}>
        <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 15, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
          Registro de actividad
        </h3>
        <p style={{ fontSize: 12, color: 'var(--n400)', marginTop: 4, marginBottom: 0 }}>
          Errores, avisos y peticiones fallidas del backend (máximo 200)
        </p>
        <div style={{ marginTop: 18 }}>
          {logs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--n400)' }}>No hay registros todavía. Todo funciona correctamente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 600, overflowY: 'auto' }}>
              {logs.map((log, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--gris-fondo)',
                }}>
                  <NivelBadge nivel={log.nivel} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--negro)' }}>
                      [{log.contexto}] {log.mensaje}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--n400)', marginTop: 2 }}>
                      {formatFechaHora(log.fecha)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  )
}
