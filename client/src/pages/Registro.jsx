import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormInput from '../components/auth/FormInput.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Registro() {
  const navigate = useNavigate()
  const { registrar } = useAuth()
  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== confirmar) { setError('Las contraseñas no coinciden'); return }
    setEnviando(true)
    try {
      await registrar({ nombreEmpresa, nombre, email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al registrarse')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <AuthLayout titulo="Crear cuenta" subtitulo="Empieza a gestionar licitaciones hoy">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput label="Empresa" value={nombreEmpresa} onChange={setNombreEmpresa} required />
        <FormInput label="Nombre" value={nombre} onChange={setNombre} required autoComplete="name" />
        <FormInput label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" />
        <FormInput label="Contraseña" type="password" value={password} onChange={setPassword} required autoComplete="new-password" />
        <FormInput label="Confirmar contraseña" type="password" value={confirmar} onChange={setConfirmar} required autoComplete="new-password" />

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
          <UserPlus size={15} />
          {enviando ? 'Registrando...' : 'Crear cuenta'}
        </button>

        <p className="text-center text-xs text-ink-3 pt-1">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand font-medium hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
