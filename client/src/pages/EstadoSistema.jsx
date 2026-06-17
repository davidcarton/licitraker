import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  RefreshCw, Clock, Cpu, Database, Building2, Users, FileText,
  AlertCircle, Box, Gauge,
} from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const UMBRAL_ALERTA = 85

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

function InfoItem({ label, value, alerta }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: alerta ? 'var(--rojo)' : 'var(--negro)' }}>
        {value ?? '—'}
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

function formatPorcentaje(valor) {
  return valor == null ? '—' : `${valor}%`
}

export default function EstadoSistema() {
  const { authFetch, usuario } = useAuth()
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/estado')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido cargar el estado del sistema')
        return
      }
      setEstado(datos)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Estado del sistema'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona del estado del sistema al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  const cpu = estado?.sistemaOperativo?.cpu
  const memoria = estado?.sistemaOperativo?.memoria
  const disco = estado?.sistemaOperativo?.disco
  const docker = estado?.docker
  const placsp = estado?.placsp
  const api = estado?.api

  return (
    <DashboardLayout title="Estado del sistema">
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
        <KPICard icon={Clock} value={formatUptime(estado?.servidor?.uptimeSegundos)} label="Tiempo activo del servidor" />
        <KPICard icon={Cpu} value={formatMB(estado?.servidor?.memoria?.rss)} label="Memoria del proceso (RSS)" />
        <KPICard icon={Gauge} value={api && api.latenciaMediaMs != null ? `${api.latenciaMediaMs} ms` : '—'} label="Tiempo medio de respuesta API" />
        <KPICard icon={Database} value={estado?.cache?.totalLicitaciones ?? '—'} label="Licitaciones en caché" />
        <KPICard icon={Building2} value={estado?.base_datos?.empresas ?? '—'} label="Empresas registradas" />
        <KPICard icon={Users} value={estado?.base_datos?.usuarios ?? '—'} label="Usuarios registrados" />
        <KPICard icon={FileText} value={estado?.base_datos?.licitacionesGuardadas ?? '—'} label="Licitaciones guardadas (total)" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Card title="Recursos del servidor" subtitle="Uso real de CPU, memoria y disco del sistema operativo">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <InfoItem
              label="CPU"
              value={cpu ? `${formatPorcentaje(cpu.porcentajeAprox)} (carga ${cpu.carga1m})` : '—'}
              alerta={cpu?.porcentajeAprox >= UMBRAL_ALERTA}
            />
            <InfoItem
              label="Memoria del sistema"
              value={memoria ? `${formatPorcentaje(memoria.porcentajeUso)} (${memoria.libreMB} MB libres de ${memoria.totalMB} MB)` : '—'}
              alerta={memoria?.porcentajeUso >= UMBRAL_ALERTA}
            />
            <InfoItem
              label="Disco"
              value={disco ? `${formatPorcentaje(disco.porcentajeUso)} (${disco.usadoGB} GB de ${disco.totalGB} GB)` : '—'}
              alerta={disco?.porcentajeUso >= UMBRAL_ALERTA}
            />
          </div>
        </Card>

        <Card title="Contenedores Docker" subtitle="postgres y pgadmin">
          {!docker || !docker.disponible ? (
            <p style={{ fontSize: 13, color: 'var(--n400)' }}>No se ha podido consultar Docker en este servidor.</p>
          ) : docker.contenedores.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--n400)' }}>No hay contenedores en ejecución.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docker.contenedores.map((c) => (
                <div key={c.nombre} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--gris-fondo)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Box size={16} color="var(--n400)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--negro)' }}>{c.nombre}</span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100,
                    background: c.estado.toLowerCase().startsWith('up') ? 'var(--verde-claro)' : 'var(--rojo-bg)',
                    color: c.estado.toLowerCase().startsWith('up') ? 'var(--verde)' : 'var(--rojo)',
                  }}>
                    {c.estado}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Feed PLACSP" subtitle="Última descarga de licitaciones del Estado">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            <InfoItem label="Última actualización" value={formatFechaHora(placsp?.ultimaActualizacion)} />
            <InfoItem label="Próxima actualización programada" value={formatFechaHora(placsp?.proximaActualizacion)} />
            <InfoItem label="Licitaciones descargadas la última vez" value={placsp?.ultimoTotalDescargado ?? '—'} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
