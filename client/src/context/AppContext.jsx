import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [licitacionesGuardadas, setLicitacionesGuardadas] = useState([])
  const [licitacionesPresentadas, setLicitacionesPresentadas] = useState([])

  const guardarLicitacion = (licitacion) => {
    setLicitacionesGuardadas(prev =>
      prev.some(l => l.expediente === licitacion.expediente) ? prev : [...prev, licitacion]
    )
  }

  const quitarLicitacion = (expediente) => {
    setLicitacionesGuardadas(prev => prev.filter(l => l.expediente !== expediente))
  }

  const marcarPresentada = (expediente) => {
    const licitacion = licitacionesGuardadas.find(l => l.expediente === expediente)
    if (!licitacion) return
    setLicitacionesGuardadas(prev => prev.filter(l => l.expediente !== expediente))
    setLicitacionesPresentadas(prev =>
      prev.some(l => l.expediente === expediente) ? prev : [...prev, licitacion]
    )
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
