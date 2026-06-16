import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormInput from '../components/auth/FormInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await login(email, password)
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Bienvenido de nuevo" subtitulo="Accede a tu cuenta para continuar">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <FormInput
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />

        {error && (
          <p className="text-xs text-danger bg-danger-light border border-danger-border rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-brand hover:bg-brand-hover disabled:opacity-60 transition-colors duration-150 mt-2"
        >
          <LogIn size={15} />
          {enviando ? 'Accediendo...' : 'Acceder'}
        </button>

        <p className="text-center text-xs text-ink-3 pt-1">
          ¿No tienes cuenta?{' '}
          <Link to="/registro" className="text-brand font-medium hover:underline">
            Regístrate
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
