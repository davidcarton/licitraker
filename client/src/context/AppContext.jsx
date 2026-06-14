import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext.jsx'

const AppContext = createContext(null)

function mapGuardada(g) {
  return {
    _id: g.id,
    expediente: g.licitacion_id,
    titulo: g.titulo,
    organismo: g.organismo,
    importe: g.importe,
    fechaLimite: g.fecha_limite,
    provincia: g.provincia,
    municipio: g.municipio,
    cpv: g.cpv,
    enlace: g.enlace,
    estado: g.estado,
  }
}

export function AppProvider({ children }) {
  const { authFetch, autenticado } = useAuth()
  const [licitacionesGuardadas, setLicitacionesGuardadas] = useState([])
  const [licitacionesPresentadas, setLicitacionesPresentadas] = useState([])

  const cargarGuardadas = useCallback(async () => {
    try {
      const res = await authFetch('/api/licitaciones-guardadas')
      const datos = await res.json()
      if (!res.ok) return
      const todas = (datos.guardadas || []).map(mapGuardada)
      setLicitacionesGuardadas(todas.filter(l => l.estado !== 'presentada'))
      setLicitacionesPresentadas(todas.filter(l => l.estado === 'presentada'))
    } catch {
      // sin conexión: se mantiene el estado actual
    }
  }, [authFetch])

  useEffect(() => {
    if (autenticado) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona de guardadas/presentadas al iniciar sesión
      cargarGuardadas()
    } else {
      setLicitacionesGuardadas([])
      setLicitacionesPresentadas([])
    }
  }, [autenticado, cargarGuardadas])

  const guardarLicitacion = async (licitacion) => {
    if (licitacionesGuardadas.some(l => l.expediente === licitacion.expediente)) return
    try {
      const res = await authFetch('/api/licitaciones-guardadas/guardar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(licitacion),
      })
      const datos = await res.json()
      if (!res.ok) return
      setLicitacionesGuardadas(prev =>
        prev.some(l => l.expediente === licitacion.expediente) ? prev : [...prev, mapGuardada(datos.guardada)]
      )
    } catch {
      // no-op: la acción no persiste sin conexión
    }
  }

  const quitarLicitacion = async (expediente) => {
    const item = licitacionesGuardadas.find(l => l.expediente === expediente)
    if (!item) return
    try {
      const res = await authFetch(`/api/licitaciones-guardadas/${item._id}`, { method: 'DELETE' })
      if (!res.ok) return
      setLicitacionesGuardadas(prev => prev.filter(l => l.expediente !== expediente))
    } catch {
      // no-op: la acción no persiste sin conexión
    }
  }

  const marcarPresentada = async (expediente) => {
    const item = licitacionesGuardadas.find(l => l.expediente === expediente)
    if (!item) return
    try {
      const res = await authFetch(`/api/licitaciones-guardadas/${item._id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'presentada' }),
      })
      const datos = await res.json()
      if (!res.ok) return
      setLicitacionesGuardadas(prev => prev.filter(l => l.expediente !== expediente))
      setLicitacionesPresentadas(prev =>
        prev.some(l => l.expediente === expediente) ? prev : [...prev, mapGuardada(datos.guardada)]
      )
    } catch {
      // no-op: la acción no persiste sin conexión
    }
  }

  return (
    <AppContext.Provider value={{
      licitacionesGuardadas,
      licitacionesPresentadas,
      guardarLicitacion,
      quitarLicitacion,
      marcarPresentada,
    }}>
      {children}
    </AppContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  return useContext(AppContext)
}
