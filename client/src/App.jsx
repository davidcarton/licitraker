import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { AppProvider } from './context/AppContext.jsx'
import RutaProtegida from './components/auth/RutaProtegida.jsx'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import Inicio from './pages/Inicio.jsx'
import Licitaciones from './pages/Licitaciones.jsx'
import ResumenIA from './pages/ResumenIA.jsx'
import MisResumenes from './pages/MisResumenes.jsx'
import Configuracion from './pages/Configuracion.jsx'
import EstadoSistema from './pages/EstadoSistema.jsx'
import LogsErrores from './pages/LogsErrores.jsx'
import GestionClientes from './pages/GestionClientes.jsx'
import './styles/global.css'

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/dashboard" element={<RutaProtegida><Inicio /></RutaProtegida>} />
            <Route path="/dashboard/licitaciones" element={<RutaProtegida><Licitaciones /></RutaProtegida>} />
            <Route path="/dashboard/resumen" element={<RutaProtegida><ResumenIA /></RutaProtegida>} />
            <Route path="/dashboard/resumenes" element={<RutaProtegida><MisResumenes /></RutaProtegida>} />
            <Route path="/dashboard/configuracion" element={<RutaProtegida><Configuracion /></RutaProtegida>} />
            <Route path="/dashboard/admin/clientes" element={<RutaProtegida><GestionClientes /></RutaProtegida>} />
            <Route path="/dashboard/admin/estado" element={<RutaProtegida><EstadoSistema /></RutaProtegida>} />
            <Route path="/dashboard/admin/logs" element={<RutaProtegida><LogsErrores /></RutaProtegida>} />
          </Routes>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  )
}
