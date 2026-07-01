import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import '../../styles/components/auth/RutaProtegida.css'

export default function RutaProtegida({ children }) {
  const { autenticado, cargando } = useAuth()
  const location = useLocation()

  if (cargando) {
    return (
      <div className="ruta-protegida">
        <div className="ruta-protegida__ring" />
      </div>
    )
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
