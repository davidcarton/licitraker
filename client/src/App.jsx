import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import MisLicitaciones from './pages/MisLicitaciones.jsx'
import Preferencias from './pages/Preferencias.jsx'
import './styles/global.css'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/licitaciones" element={<MisLicitaciones />} />
        <Route path="/dashboard/preferencias" element={<Preferencias />} />
      </Routes>
    </HashRouter>
  )
}
