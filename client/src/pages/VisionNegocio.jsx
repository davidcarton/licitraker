import { useState, useEffect, useCallback } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { RefreshCw, Building2, Wallet, AlertCircle, TrendingUp, Sparkles } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte, formatFecha, formatFechaLarga, iniciales } from '../utils/format.js'
import '../styles/pages/VisionNegocio.css'

function GraficaCrecimiento({ datos }) {
  const max = Math.max(...datos.map(d => d.altas), 1)
  return (
    <div className="vn-panel">
      <h3 className="vn-panel__titulo vn-grafica-titulo">
        Nuevos clientes · últimos 6 meses
      </h3>
      <div className="vn-grafica-wrap">
        {datos.map((d, i) => {
          const esActual = i === datos.length - 1
          const altura = Math.max(Math.round((d.altas / max) * 88), 3)
          return (
            <div key={d.mes} className="vn-barra-col">
              <span className={`vn-barra__valor${esActual ? ' vn-barra__valor--actual' : ''}`}>
                {d.altas}
              </span>
              <div
                className={`vn-barra${esActual ? ' vn-barra--actual' : ''}`}
                style={{ '--alto': `${altura}px` }}
              />
              <span className={`vn-barra__label${esActual ? ' vn-barra__label--actual' : ''}`}>
                {d.etiqueta}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function PanelCuentasYPlanes({ planes, totalActivas, totalInactivas }) {
  const total = totalActivas + totalInactivas
  const pctActivas = total > 0 ? Math.round((totalActivas / total) * 100) : 0
  const maxMrr = Math.max(...planes.map(p => p.mrr), 1)

  return (
    <div className="vn-panel vn-panel--col">
      {/* Estado de cuentas */}
      <div>
        <div className="vn-cuentas-header">
          <h3 className="vn-panel__titulo">{`Estado de cuentas`}</h3>
          <span className="vn-cuentas-pct">{pctActivas}% activas</span>
        </div>
        <div className="vn-progreso-rail">
          <div className="vn-progreso-barra" style={{ '--pct': `${pctActivas}%` }} />
        </div>
        <div className="vn-cuentas-totales">
          <span><b className="vn-count-activas">{totalActivas}</b> activas</span>
          <span><b className="vn-count-inactivas">{totalInactivas}</b> inactivas</span>
        </div>
      </div>

      {/* Desglose por plan */}
      <div>
        <h3 className="vn-panel__titulo vn-planes-titulo">Ingresos por plan</h3>
        {planes.length === 0 ? (
          <p className="vn-sinclientes">Sin empresas de pago activas todavía.</p>
        ) : (
          <div className="vn-planes-lista">
            {planes.map(p => (
              <div key={p.plan} className="vn-plan-item">
                <div className="vn-plan-header">
                  <span className="vn-plan-nombre">
                    {p.plan}
                    <span className="vn-plan-cantidad">
                      {p.empresasActivas} {p.empresasActivas === 1 ? 'empresa' : 'empresas'}
                    </span>
                  </span>
                  <span className="vn-plan-mrr">{formatImporte(p.mrr)} €</span>
                </div>
                <div className="vn-plan-rail">
                  <div
                    className="vn-plan-barra"
                    style={{ '--pct': `${Math.max(Math.round((p.mrr / maxMrr) * 100), 4)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ClientesRecientes({ clientes, onVer }) {
  return (
    <div className="vn-panel">
      <div className="vn-clientes-header">
        <h3 className="vn-panel__titulo">Últimas incorporaciones</h3>
        <button onClick={onVer} className="vn-btn-ver-todos">Ver todos →</button>
      </div>
      {clientes.length === 0 ? (
        <p className="vn-sinclientes">Sin clientes registrados todavía.</p>
      ) : (
        <div className="vn-clientes-lista">
          {clientes.map((c, i) => (
            <div
              key={c.id}
              onClick={onVer}
              className={`vn-cliente-fila${i < clientes.length - 1 ? ' vn-cliente-fila--borde' : ''}`}
            >
              <div className="vn-cliente-avatar">{iniciales(c.nombre)}</div>
              <div className="vn-cliente-info">
                <div className="vn-cliente-nombre">{c.nombre}</div>
                <div className="vn-cliente-plan">{c.plan} · Alta {formatFecha(c.createdAt)}</div>
              </div>
              <span className={`vn-cliente-badge ${c.activa ? 'vn-cliente-badge--activa' : 'vn-cliente-badge--inactiva'}`}>
                {c.activa ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SaludSistema({ estado }) {
  const cpu   = estado.sistemaOperativo?.cpu
  const mem   = estado.sistemaOperativo?.memoria
  const disco = estado.sistemaOperativo?.disco

  const fila = (label, valor, alerta = false, last = false) => (
    <div className={`vn-salud-fila${last ? ' vn-salud-fila--last' : ''}`}>
      <span className="vn-salud-label">{label}</span>
      <span className={`vn-salud-valor ${alerta ? 'vn-salud-valor--alerta' : 'vn-salud-valor--normal'}`}>
        {valor ?? '—'}
      </span>
    </div>
  )

  const uptimeH = estado.servidor?.uptimeSegundos != null
    ? Math.floor(estado.servidor.uptimeSegundos / 3600) + 'h ' +
      Math.floor((estado.servidor.uptimeSegundos % 3600) / 60) + 'm'
    : null

  return (
    <div className="vn-panel">
      <h3 className="vn-panel__titulo vn-grafica-titulo">Estado del sistema</h3>
      <div>
        {fila('CPU', cpu?.porcentajeAprox != null ? `${cpu.porcentajeAprox}%` : null, (cpu?.porcentajeAprox ?? 0) > 80)}
        {fila('RAM', mem?.porcentajeUso != null ? `${mem.porcentajeUso}% de ${mem.totalMB} MB` : null, (mem?.porcentajeUso ?? 0) > 85)}
        {fila('Disco', disco?.porcentajeUso != null ? `${disco.porcentajeUso}% de ${disco.totalGB} GB` : null, (disco?.porcentajeUso ?? 0) > 85)}
        {fila('Latencia API', estado.api?.latenciaMediaMs != null ? `${estado.api.latenciaMediaMs} ms` : null, (estado.api?.latenciaMediaMs ?? 0) > 500)}
        {fila('Licitaciones en caché', estado.cache?.totalLicitaciones ?? null, (estado.cache?.totalLicitaciones ?? 1) === 0)}
        {fila('Uptime servidor', uptimeH)}
        {fila(
          'Última actualización feed',
          estado.cache?.ultimaActualizacion ? formatFecha(estado.cache.ultimaActualizacion) : '—',
          false,
          true,
        )}
      </div>
    </div>
  )
}

function saludo() {
  const h = new Date().getHours()
  if (h < 14) return 'Buenos días'
  if (h < 21) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function VisionNegocio() {
  const { authFetch, usuario } = useAuth()
  const navigate = useNavigate()
  const [negocio, setNegocio] = useState(null)
  const [estado, setEstado] = useState(null)
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [resNegocio, resEstado, resClientes] = await Promise.all([
        authFetch('/api/admin/negocio'),
        authFetch('/api/admin/estado'),
        authFetch('/api/admin/clientes'),
      ])
      const [datosNegocio, datosEstado, datosClientes] = await Promise.all([
        resNegocio.json(),
        resEstado.json(),
        resClientes.json(),
      ])
      if (!resNegocio.ok) {
        setError(datosNegocio.error || 'No se han podido cargar los datos')
        return
      }
      setNegocio(datosNegocio)
      if (resEstado.ok) setEstado(datosEstado)
      if (resClientes.ok) setClientes((datosClientes.empresas || []).slice(0, 5))
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Visión general del negocio'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Visión general del negocio">
      <div className="vn-cabecera">
        <div>
          <h2 className="vn-titulo">
            {saludo()}, {usuario?.nombre?.split(' ')[0] || 'admin'}
          </h2>
          <p className="vn-fecha">{formatFechaLarga()}</p>
        </div>
        <button onClick={cargar} disabled={cargando} className="vn-btn-actualizar">
          <RefreshCw size={15} className={cargando ? 'spin-icon' : ''} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="vn-error-banner">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Fila 1 — KPIs */}
      <div className="vn-kpi-grid">
        <KPICard
          icon={Wallet}
          value={negocio ? `${formatImporte(negocio.mrr)} €` : '—'}
          label="MRR mensual"
        />
        <KPICard
          icon={Building2}
          value={negocio?.totalActivas ?? '—'}
          label={negocio ? `Activos de ${negocio.totalEmpresas} clientes` : 'Clientes activos'}
        />
        <KPICard
          icon={TrendingUp}
          value={negocio?.altasEstaSemana ?? '—'}
          label="Altas esta semana"
        />
        <KPICard
          icon={Sparkles}
          value={negocio ? `€${negocio.costeIA >= 1 ? negocio.costeIA.toFixed(2) : negocio.costeIA.toFixed(4)}` : '—'}
          label="Coste IA (API)"
        />
      </div>

      {/* Fila 2 — Gráfica + Planes */}
      {negocio && (
        <div className="vn-grafica-planes-grid">
          <GraficaCrecimiento datos={negocio.crecimientoMensual} />
          <PanelCuentasYPlanes
            planes={negocio.desglosePorPlan}
            totalActivas={negocio.totalActivas}
            totalInactivas={negocio.totalInactivas}
          />
        </div>
      )}

      {/* Fila 3 — Clientes recientes + Salud del sistema */}
      <div className="vn-dos-cols-grid">
        <ClientesRecientes
          clientes={clientes}
          onVer={() => navigate('/dashboard/admin/clientes')}
        />
        {estado && <SaludSistema estado={estado} />}
      </div>
    </DashboardLayout>
  )
}
