import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)
const TOKEN_KEY = 'licitaplus_token'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  const cargarUsuario = useCallback(async (tok) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${tok}` },
      })
      const datos = await res.json()
      if (res.ok) {
        setUsuario(datos.usuario)
      } else {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUsuario(null)
      }
    } catch {
      setUsuario(null)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- carga asíncrona del usuario al montar/cambiar el token
      cargarUsuario(token)
    } else {
      setCargando(false)
    }
  }, [token, cargarUsuario])

  const guardarSesion = (datos) => {
    localStorage.setItem(TOKEN_KEY, datos.token)
    setToken(datos.token)
    setUsuario(datos.usuario)
  }

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const datos = await res.json()
    if (!res.ok) throw new Error(datos.error || 'No se ha podido iniciar sesión')
    guardarSesion(datos)
  }

  const registrar = async (campos) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campos),
    })
    const datos = await res.json()
    if (!res.ok) throw new Error(datos.error || 'No se ha podido completar el registro')
    guardarSesion(datos)
  }

  const logout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUsuario(null)
  }

  const authFetch = useCallback((url, opts = {}) => {
    return fetch(url, {
      ...opts,
      headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` },
    })
  }, [token])

  return (
    <AuthContext.Provider value={{
      usuario,
      cargando,
      autenticado: !!usuario,
      login,
      registrar,
      logout,
      authFetch,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
