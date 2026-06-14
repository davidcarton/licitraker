import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await login(email, password)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Inicia sesión" subtitulo="Accede al panel de tu empresa">
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', marginBottom: 16,
            borderRadius: 'var(--r-md)',
            background: 'var(--rojo-bg)', border: '1px solid var(--rojo-borde)',
            color: 'var(--rojo)', fontSize: 13, fontFamily: 'var(--font-body)',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        <div className="auth-field">
          <label className="auth-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="auth-input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tucorreo@empresa.com"
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="password">Contraseña</label>
          <input
            id="password"
            className="auth-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button className="auth-submit" type="submit" disabled={enviando}>
          <LogIn size={16} />
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--n500)', marginTop: 24, textAlign: 'center' }}>
        ¿Todavía no tienes cuenta?{' '}
        <Link className="auth-link" to="/registro">Crea una gratis</Link>
      </p>
    </AuthLayout>
  )
}
