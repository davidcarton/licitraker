import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  RefreshCw, Clock, Cpu, Database, Building2, Users, FileText,
  AlertCircle, AlertTriangle, Info,
} from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
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

function Card({ title, subtitle, children }) {
  return (
    <section style={{
      background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)',
      boxShadow: 'var(--shadow-card)', padding: '22px 24px',
    }}>
      <h3 style={{ fontFamily: 'var(--font-titulo)', fontSize: 15, fontWeight: 700, color: 'var(--negro)', margin: 0 }}>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: 12, color: 'var(--n400)', marginTop: 4, marginBottom: 0 }}>{subtitle}</p>
      )}
      <div style={{ marginTop: 18 }}>{children}</div>
    </section>
  )
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--negro)' }}>
        {value || '—'}
      </div>
    </div>
  )
}

function formatUptime(segundos) {
  if (!segundos) return '—'
  const dias = Math.floor(segundos / 86400)
  const horas = Math.floor((segundos % 86400) / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)
  if (dias > 0) return `${dias}d ${horas}h`
  if (horas > 0) return `${horas}h ${minutos}m`
  return `${minutos}m`
}

function formatMB(bytes) {
  if (!bytes) return '—'
  return `${(bytes / 1024 / 1024).toFixed(0)} MB`
}

function formatFechaHora(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  return d.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'medium' })
}

export default function Admin() {
  const { authFetch, usuario } = useAuth()
  const [estado, setEstado] = useState(null)
  const [logs, setLogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [resEstado, resLogs] = await Promise.all([
        authFetch('/api/admin/estado'),
        authFetch('/api/admin/logs'),
      ])
      const [datosEstado, datosLogs] = await Promise.all([resEstado.json(), resLogs.json()])
      if (!resEstado.ok || !resLogs.ok) {
        setError(datosEstado.error || datosLogs.error || 'No se ha podido cargar el panel de administración')
        return
      }
      setEstado(datosEstado)
      setLogs(datosLogs.logs || [])
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Administración'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona del estado del sistema al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Administración">
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard icon={Clock} value={estado ? formatUptime(estado.servidor.uptimeSegundos) : '—'} label="Tiempo activo del servidor" />
        <KPICard icon={Cpu} value={estado ? formatMB(estado.servidor.memoria.rss) : '—'} label="Memoria en uso (RSS)" />
        <KPICard icon={Database} value={estado ? estado.cache.totalLicitaciones : '—'} label="Licitaciones en caché" />
        <KPICard icon={Building2} value={estado ? estado.base_datos.empresas : '—'} label="Empresas registradas" />
        <KPICard icon={Users} value={estado ? estado.base_datos.usuarios : '—'} label="Usuarios registrados" />
        <KPICard icon={FileText} value={estado ? estado.base_datos.licitacionesGuardadas : '—'} label="Licitaciones guardadas (total)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card title="Estado del sistema" subtitle="Información en tiempo real del servidor y la caché de licitaciones">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <InfoItem label="Versión de Node" value={estado?.servidor.nodeVersion} />
            <InfoItem label="Última actualización de la caché" value={formatFechaHora(estado?.cache.ultimaActualizacion)} />
            <InfoItem label="Próxima actualización programada" value={formatFechaHora(estado?.cache.proximaActualizacion)} />
            <InfoItem label="Hora del servidor" value={formatFechaHora(estado?.servidor.fecha)} />
          </div>
        </Card>

        <Card title="Registro de actividad" subtitle="Últimos errores y avisos del sistema (máximo 200)">
          {logs.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--n400)' }}>No hay registros todavía. Todo funciona correctamente.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
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
        </Card>
      </div>
    </DashboardLayout>
  )
}
