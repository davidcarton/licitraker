import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  RefreshCw, Clock, Cpu, Database, Building2, Users, FileText,
  AlertCircle, Box, Gauge,
} from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import '../styles/pages/EstadoSistema.css'

const UMBRAL_ALERTA = 85

function Card({ title, subtitle, children }) {
  return (
    <section className="es-card">
      <h3 className="es-card__titulo">{title}</h3>
      {subtitle && <p className="es-card__subtitulo">{subtitle}</p>}
      <div className="es-card__body">{children}</div>
    </section>
  )
}

function InfoItem({ label, value, alerta }) {
  return (
    <div>
      <div className="es-info-label">{label}</div>
      <div className={`es-info-valor${alerta ? ' es-info-valor--alerta' : ''}`}>{value ?? '—'}</div>
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

  const cpu     = estado?.sistemaOperativo?.cpu
  const memoria = estado?.sistemaOperativo?.memoria
  const disco   = estado?.sistemaOperativo?.disco
  const docker  = estado?.docker
  const placsp  = estado?.placsp
  const api     = estado?.api

  return (
    <DashboardLayout title="Estado del sistema">
      <div className="es-btn-wrap">
        <button onClick={cargar} disabled={cargando} className="es-btn-actualizar">
          <RefreshCw size={15} className={cargando ? 'spin-icon' : ''} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="es-error-banner">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="es-kpi-grid">
        <KPICard icon={Clock}     value={formatUptime(estado?.servidor?.uptimeSegundos)}                                             label="Tiempo activo del servidor" />
        <KPICard icon={Cpu}       value={formatMB(estado?.servidor?.memoria?.rss)}                                                  label="Memoria del proceso (RSS)" />
        <KPICard icon={Gauge}     value={api && api.latenciaMediaMs != null ? `${api.latenciaMediaMs} ms` : '—'}                   label="Tiempo medio de respuesta API" />
        <KPICard icon={Database}  value={estado?.cache?.totalLicitaciones ?? '—'}                                                   label="Licitaciones en caché" />
        <KPICard icon={Building2} value={estado?.base_datos?.empresas ?? '—'}                                                       label="Empresas registradas" />
        <KPICard icon={Users}     value={estado?.base_datos?.usuarios ?? '—'}                                                       label="Usuarios registrados" />
        <KPICard icon={FileText}  value={estado?.base_datos?.licitacionesGuardadas ?? '—'}                                          label="Licitaciones guardadas (total)" />
      </div>

      <div className="es-cards">
        <Card title="Recursos del servidor" subtitle="Uso real de CPU, memoria y disco del sistema operativo">
          <div className="es-info-grid">
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
            <p className="es-docker-vacio">No se ha podido consultar Docker en este servidor.</p>
          ) : docker.contenedores.length === 0 ? (
            <p className="es-docker-vacio">No hay contenedores en ejecución.</p>
          ) : (
            <div className="es-docker-lista">
              {docker.contenedores.map((c) => {
                const activo = c.estado.toLowerCase().startsWith('up')
                return (
                  <div key={c.nombre} className="es-docker-fila">
                    <div className="es-docker-nombre-wrap">
                      <Box size={16} color="var(--n400)" />
                      <span className="es-docker-nombre">{c.nombre}</span>
                    </div>
                    <span className={`es-docker-badge ${activo ? 'es-docker-badge--up' : 'es-docker-badge--stopped'}`}>
                      {c.estado}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card title="Feed PLACSP" subtitle="Última descarga de licitaciones del Estado">
          <div className="es-info-grid">
            <InfoItem label="Última actualización" value={formatFechaHora(placsp?.ultimaActualizacion)} />
            <InfoItem label="Próxima actualización programada" value={formatFechaHora(placsp?.proximaActualizacion)} />
            <InfoItem label="Licitaciones descargadas la última vez" value={placsp?.ultimoTotalDescargado ?? '—'} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
