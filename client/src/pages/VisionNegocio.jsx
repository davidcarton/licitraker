import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  RefreshCw, Building2, CheckCircle2, XCircle, UserPlus, Wallet, Award, AlertCircle,
} from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import KPICard from '../components/dashboard/KPICard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte } from '../utils/format.js'

export default function VisionNegocio() {
  const { authFetch, usuario } = useAuth()
  const [negocio, setNegocio] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/negocio')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se ha podido cargar la visión de negocio')
        return
      }
      setNegocio(datos)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Visión general del negocio'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de la visión de negocio al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Visión general del negocio">
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        <KPICard icon={Building2} value={negocio?.totalEmpresas ?? '—'} label="Empresas registradas" />
        <KPICard icon={CheckCircle2} value={negocio?.totalActivas ?? '—'} label="Empresas activas" />
        <KPICard icon={XCircle} value={negocio?.totalInactivas ?? '—'} label="Empresas inactivas" />
        <KPICard icon={UserPlus} value={negocio?.altasEstaSemana ?? '—'} label="Nuevas altas esta semana" />
        <KPICard icon={Wallet} value={negocio ? `${formatImporte(negocio.mrr)} €` : '—'} label="Ingresos recurrentes del mes (MRR)" />
        <KPICard icon={Award} value={negocio?.planMasContratado ?? '—'} label="Plan más contratado" />
      </div>
    </DashboardLayout>
  )
}
