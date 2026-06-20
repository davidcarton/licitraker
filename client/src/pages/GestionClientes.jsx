import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import { AlertCircle, RefreshCw } from 'lucide-react'
import DashboardLayout from '../components/dashboard/DashboardLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatImporte, formatFecha } from '../utils/format.js'

function BadgeEstado({ activa }) {
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 100,
      background: activa ? 'var(--verde-claro)' : 'var(--rojo-bg)',
      color: activa ? 'var(--verde)' : 'var(--rojo)',
      fontSize: 11, fontWeight: 700,
    }}>
      {activa ? 'Activa' : 'Inactiva'}
    </span>
  )
}

export default function GestionClientes() {
  const { authFetch, usuario } = useAuth()
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const res = await authFetch('/api/admin/clientes')
      const datos = await res.json()
      if (!res.ok) {
        setError(datos.error || 'No se han podido cargar los clientes')
        return
      }
      setClientes(datos.empresas)
    } catch {
      setError('No se ha podido conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }, [authFetch])

  useEffect(() => {
    const tituloPrevio = document.title
    document.title = 'LiciTracker · Gestión de clientes'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de la lista de clientes al montar
    cargar()
    return () => { document.title = tituloPrevio }
  }, [cargar])

  if (usuario && usuario.rol !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <DashboardLayout title="Gestión de clientes">
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

      <div style={{ background: '#fff', borderRadius: 'var(--r-xl)', border: '1px solid var(--n100)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gris-fondo)' }}>
              {['Nombre', 'Plan', 'Precio', 'Estado', 'Fecha de alta'].map(col => (
                <th key={col} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--n400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--n400)', fontSize: 13 }}>
                  No hay clientes registrados todavía.
                </td>
              </tr>
            ) : (
              clientes.map(c => (
                <tr key={c.id} style={{ borderTop: '1px solid var(--n100)', cursor: 'pointer' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--negro)' }}>{c.nombre}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{c.plan}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{c.precioMensual != null ? `${formatImporte(c.precioMensual)} €` : '—'}</td>
                  <td style={{ padding: '12px 16px' }}><BadgeEstado activa={c.activa} /></td>
                  <td style={{ padding: '12px 16px', color: 'var(--n500)' }}>{formatFecha(c.createdAt) || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  )
}
