import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Licitaciones from './pages/Licitaciones.jsx'
import ResumenIA from './pages/ResumenIA.jsx'
import Configuracion from './pages/Configuracion.jsx'
import './styles/global.css'

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/licitaciones" element={<Licitaciones />} />
          <Route path="/dashboard/resumen" element={<ResumenIA />} />
          <Route path="/dashboard/configuracion" element={<Configuracion />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  )
}
