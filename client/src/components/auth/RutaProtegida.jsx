import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function RutaProtegida({ children }) {
  const { autenticado, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{
          width: 40, height: 40,
          borderRadius: '50%',
          border: '3px solid var(--g100)',
          borderTopColor: 'var(--g700)',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
