import { useAuth } from '../context/AuthContext.jsx'
import Dashboard from './Dashboard.jsx'
import VisionNegocio from './VisionNegocio.jsx'

export default function Inicio() {
  const { usuario } = useAuth()
  return usuario?.rol === 'superadmin' ? <VisionNegocio /> : <Dashboard />
}
