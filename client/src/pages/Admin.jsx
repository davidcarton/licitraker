import { useEffect, useState } from 'react'
import { Database, Cpu, HardDrive, RefreshCw } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import Alert from '../components/ui/Alert.jsx'
import Badge from '../components/ui/Badge.jsx'
import DataTable from '../components/ui/DataTable.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Admin() {
  const { usuario, authFetch } = useAuth()
  const [stats, setStats] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (usuario?.rol !== 'superadmin') return
    document.title = 'LiciTraker · Admin'
    authFetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setStats(d) })
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
    return () => { document.title = 'LiciTraker' }
  }, [usuario, authFetch])

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
        <Alert variant="error" title="Error al cargar estadísticas" className="mb-6">
          {error}
        </Alert>
      )}

      {cargando && (
        <p className="text-sm text-ink-3 mb-6 flex items-center gap-2">
          <RefreshCw size={14} className="animate-spin" /> Cargando estadísticas...
        </p>
      )}

      {stats && (
        <>
          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <KPICard icon={Database} value={stats.totalLicitaciones ?? '—'} label="Licitaciones en BD" />
            <KPICard icon={Cpu} value={stats.procesadasHoy ?? '—'} label="Procesadas hoy" />
            <KPICard icon={HardDrive} value={stats.cacheSize ?? '—'} label="Tamaño caché" />
          </div>

          {stats.alertas?.length > 0 && (
            <div className="space-y-3 mb-8">
              <h3 className="text-sm font-semibold text-ink">Alertas del sistema</h3>
              {stats.alertas.map((a, i) => (
                <Alert key={i} variant={a.tipo ?? 'info'} title={a.titulo}>
                  {a.mensaje}
                </Alert>
              ))}
            </div>
          )}

          {stats.logs?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-ink mb-3">Últimas actualizaciones</h3>
              <DataTable
                columns={[
                  { key: 'fecha', label: 'Fecha', mono: true },
                  { key: 'fuente', label: 'Fuente' },
                  { key: 'total', label: 'Registros', align: 'right', mono: true },
                  {
                    key: 'estado',
                    label: 'Estado',
                    render: v => {
                      const variant = v === 'ok' ? 'enplazo' : v === 'error' ? 'urgente' : 'neutral'
                      return <Badge variant={variant}>{v}</Badge>
                    },
                  },
                ]}
                data={stats.logs}
              />
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
