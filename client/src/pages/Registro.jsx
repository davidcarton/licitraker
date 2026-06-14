import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import AuthLayout from '../components/auth/AuthLayout.jsx'

export default function Registro() {
  const { registrar } = useAuth()
  const navigate = useNavigate()

  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    setEnviando(true)
    try {
      await registrar({ nombreEmpresa, nombre, email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Crea tu cuenta" subtitulo="Empieza a seguir licitaciones de obra pública en minutos">
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
          <label className="auth-label" htmlFor="nombreEmpresa">Nombre de la empresa</label>
          <input
            id="nombreEmpresa"
            className="auth-input"
            type="text"
            value={nombreEmpresa}
            onChange={(e) => setNombreEmpresa(e.target.value)}
            placeholder="Constructora García S.L."
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="nombre">Tu nombre</label>
          <input
            id="nombre"
            className="auth-input"
            type="text"
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellidos"
            required
          />
        </div>

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="confirmar">Repite la contraseña</label>
          <input
            id="confirmar"
            className="auth-input"
            type="password"
            autoComplete="new-password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button className="auth-submit" type="submit" disabled={enviando}>
          <UserPlus size={16} />
          {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--n500)', marginTop: 24, textAlign: 'center' }}>
        ¿Ya tienes cuenta?{' '}
        <Link className="auth-link" to="/login">Inicia sesión</Link>
      </p>
    </AuthLayout>
  )
}
