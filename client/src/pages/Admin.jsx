import { useEffect, useState } from 'react'
import {
  Database, Cpu, HardDrive, RefreshCw, Users, Building2,
  AlertCircle, AlertTriangle, Info, CheckCircle2, Clock,
} from 'lucide-react'
import { motion } from 'framer-motion'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import Badge from '../components/ui/Badge.jsx'
import Tabs from '../components/ui/Tabs.jsx'
import Alert from '../components/ui/Alert.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const TABS_ADMIN = [
  { id: 'sistema',   label: 'Sistema' },
  { id: 'empresas',  label: 'Empresas' },
  { id: 'logs',      label: 'Logs de errores' },
]

const PLAN_LABEL = {
  starter: { label: 'Starter', color: '#6b7280', bg: '#f3f4f6' },
  pro:     { label: 'Pro',     color: '#2A5938', bg: '#F0FDF4' },
  enterprise: { label: 'Enterprise', color: '#1d4ed8', bg: '#eff6ff' },
}

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatUptime(seg) {
  if (!seg) return '—'
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m ${seg % 60}s`
}

function LogRow({ log }) {
  const map = {
    error: { icon: AlertCircle,    color: '#dc2626', bg: '#fef2f2' },
    warn:  { icon: AlertTriangle,  color: '#d97706', bg: '#fffbeb' },
    info:  { icon: Info,           color: '#2563eb', bg: '#eff6ff' },
  }
  const cfg = map[log.nivel] ?? map.info
  const Icon = cfg.icon

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 14px',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.13s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        <Icon size={13} color={cfg.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: cfg.color,
          }}>
            {log.contexto}
          </span>
          <span style={{
            fontSize: 10, color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
          }}>
            {new Date(log.fecha).toLocaleString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' })}
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: 'var(--text-primary)', lineHeight: 1.5 }}>
          {log.mensaje}
        </p>
      </div>
    </div>
  )
}

function EmpresaRow({ empresa }) {
  const plan = PLAN_LABEL[empresa.plan] ?? PLAN_LABEL.starter

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto auto auto auto',
      alignItems: 'center',
      gap: 16,
      padding: '12px 16px',
      borderBottom: '1px solid var(--border)',
      transition: 'background 0.13s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {empresa.nombre}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
          {empresa.email_contacto || '—'}{empresa.cif ? ` · ${empresa.cif}` : ''}
        </p>
      </div>

      <span style={{
        fontSize: 11, fontWeight: 700,
        padding: '2px 9px', borderRadius: 20,
        background: plan.bg, color: plan.color,
        whiteSpace: 'nowrap',
      }}>
        {plan.label}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
        <Users size={12} />
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{empresa.total_usuarios}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
        <Database size={12} />
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{empresa.total_guardadas}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {empresa.activa ? (
          <>
            <CheckCircle2 size={13} color="#16a34a" />
            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Al corriente</span>
          </>
        ) : (
          <>
            <AlertCircle size={13} color="#dc2626" />
            <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Inactiva</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function Admin() {
  const { usuario, authFetch } = useAuth()
  const [tab, setTab] = useState('sistema')
  const [stats, setStats]       = useState(null)
  const [empresas, setEmpresas] = useState(null)
  const [logs, setLogs]         = useState(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    if (usuario?.rol !== 'superadmin') return
    document.title = 'LiciTraker · Admin'
    cargarStats()
    return () => { document.title = 'LiciTraker' }
  }, [usuario])

  useEffect(() => {
    if (usuario?.rol !== 'superadmin') return
    if (tab === 'empresas' && !empresas) cargarEmpresas()
    if (tab === 'logs' && !logs) cargarLogs()
  }, [tab, usuario])

  async function cargarStats() {
    setCargando(true); setError(null)
    try {
      const r = await authFetch('/api/admin/stats')
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setStats(d)
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  async function cargarEmpresas() {
    try {
      const r = await authFetch('/api/admin/empresas')
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setEmpresas(d.empresas)
    } catch (e) {
      setError(e.message)
    }
  }

  async function cargarLogs() {
    try {
      const r = await authFetch('/api/admin/logs')
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setLogs(d.logs)
    } catch (e) {
      setError(e.message)
    }
  }

  if (usuario?.rol !== 'superadmin') {
    return (
      <DashboardLayout title="Admin">
        <Alert variant="error" title="Acceso denegado">
          Esta sección está restringida a administradores del sistema.
        </Alert>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Administración">
      {error && (
        <Alert variant="error" title="Error" className="mb-6">{error}</Alert>
      )}

      <Tabs tabs={TABS_ADMIN} active={tab} onChange={setTab} />

      <div style={{ paddingTop: 24 }}>

        {/* ── SISTEMA ── */}
        {tab === 'sistema' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button
                onClick={cargarStats}
                disabled={cargando}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 500, cursor: 'pointer',
                  padding: '6px 12px', borderRadius: 7,
                  background: 'var(--bg-subtle)', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', fontFamily: 'inherit',
                }}
              >
                <RefreshCw size={12} style={{ animation: cargando ? 'spin 0.8s linear infinite' : 'none' }} />
                Actualizar
              </button>
            </div>

            {cargando && !stats && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Cargando...
              </p>
            )}

            {stats && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
                  <KPICard icon={Database} value={stats.totalLicitaciones ?? '—'} label="Licitaciones en caché" />
                  <KPICard icon={Building2} value={stats.totalEmpresas ?? '—'} label="Empresas registradas" />
                  <KPICard icon={Users} value={stats.totalUsuarios ?? '—'} label="Usuarios activos" />
                  <KPICard icon={HardDrive} value={stats.totalGuardadas ?? '—'} label="Licitaciones guardadas" />
                </div>

                {/* Servidor */}
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px 20px',
                  marginBottom: 20,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 14 }}>
                    Información del servidor
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px 24px' }}>
                    <InfoItem label="Uptime" value={formatUptime(stats.uptime)} icon={<Clock size={12} />} />
                    <InfoItem label="Node.js" value={stats.nodeVersion} icon={<Cpu size={12} />} />
                    <InfoItem label="Memoria heap" value={formatBytes(stats.memoria?.heapUsed)} icon={<HardDrive size={12} />} />
                    <InfoItem label="Última actualización" value={stats.ultimaActualizacion ? new Date(stats.ultimaActualizacion).toLocaleString('es-ES') : '—'} icon={<RefreshCw size={12} />} />
                    <InfoItem label="Próxima actualización" value={stats.proximaActualizacion ? new Date(stats.proximaActualizacion).toLocaleString('es-ES') : '—'} icon={<Clock size={12} />} />
                  </div>
                </div>

                {/* Logs rápidos */}
                {stats.logs?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>
                      Últimos errores / advertencias
                    </p>
                    <div style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 12, overflow: 'hidden',
                    }}>
                      {stats.logs.slice(0, 10).map((l, i) => <LogRow key={i} log={l} />)}
                    </div>
                  </div>
                )}
                {!stats.logs?.length && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    <CheckCircle2 size={20} color="var(--success)" style={{ margin: '0 auto 8px' }} />
                    Sin errores registrados
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* ── EMPRESAS ── */}
        {tab === 'empresas' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {!empresas ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando empresas...</p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {empresas.length} empresa{empresas.length !== 1 ? 's' : ''} registrada{empresas.length !== 1 ? 's' : ''}
                </p>
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12, overflow: 'hidden',
                }}>
                  {/* Cabecera */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto auto',
                    gap: 16,
                    padding: '9px 16px',
                    background: 'var(--bg-subtle)',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    {['Empresa', 'Plan', 'Usuarios', 'Guardadas', 'Estado pago'].map(h => (
                      <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                        {h}
                      </span>
                    ))}
                  </div>
                  {empresas.map(e => <EmpresaRow key={e.id} empresa={e} />)}
                  {empresas.length === 0 && (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      No hay empresas registradas
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ── LOGS ── */}
        {tab === 'logs' && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            {!logs ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Cargando logs...</p>
            ) : logs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <CheckCircle2 size={24} color="var(--success)" style={{ margin: '0 auto 10px' }} />
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Sin errores registrados en este ciclo</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {logs.length} entrada{logs.length !== 1 ? 's' : ''} · Ciclo actual (máx. 200)
                </p>
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12, overflow: 'hidden',
                }}>
                  {logs.map((l, i) => <LogRow key={i} log={l} />)}
                </div>
              </>
            )}
          </motion.div>
        )}

      </div>
    </DashboardLayout>
  )
}

function InfoItem({ label, value, icon }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
          {label}
        </p>
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
        {value}
      </p>
    </div>
  )
}
