const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db')
const auth = require('../middleware/auth')

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, empresa_id: usuario.empresa_id, rol: usuario.rol, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d', algorithm: 'HS256' }
  )
}

function datosPublicos(usuario, empresa) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    empresa: empresa ? { id: empresa.id, nombre: empresa.nombre, plan: empresa.plan } : null
  }
}

router.post('/register', async (req, res) => {
  try {
    const { nombreEmpresa, nombre, email, password } = req.body || {}
    if (!nombreEmpresa?.trim() || !nombre?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' })
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    }

    const emailNormalizado = email.trim().toLowerCase()
    const existente = await db('usuarios').where({ email: emailNormalizado }).first()
    if (existente) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const { usuario, empresa } = await db.transaction(async trx => {
      const [empresaCreada] = await trx('empresas')
        .insert({ nombre: nombreEmpresa.trim(), email_contacto: emailNormalizado })
        .returning('*')

      const [usuarioCreado] = await trx('usuarios')
        .insert({
          empresa_id: empresaCreada.id,
          nombre: nombre.trim(),
          email: emailNormalizado,
          password_hash: passwordHash,
          rol: 'admin'
        })
        .returning('*')

      return { usuario: usuarioCreado, empresa: empresaCreada }
    })

    const token = generarToken(usuario)
    res.status(201).json({ token, usuario: datosPublicos(usuario, empresa) })
  } catch (err) {
    console.error('[auth] Error en register:', err.message)
    res.status(500).json({ error: 'No se ha podido completar el registro' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' })
    }

    const usuario = await db('usuarios').where({ email: email.trim().toLowerCase() }).first()
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    const valido = await bcrypt.compare(password, usuario.password_hash)
    if (!valido) {
      return res.status(401).json({ error: 'Credenciales incorrectas' })
    }

    await db('usuarios').where({ id: usuario.id }).update({ ultimo_acceso: db.fn.now() })
    const empresa = await db('empresas').where({ id: usuario.empresa_id }).first()

    const token = generarToken(usuario)
    res.json({ token, usuario: datosPublicos(usuario, empresa) })
  } catch (err) {
    console.error('[auth] Error en login:', err.message)
    res.status(500).json({ error: 'No se ha podido iniciar sesión' })
  }
})

router.post('/logout', (req, res) => {
  res.json({ ok: true })
})

router.get('/me', auth, async (req, res) => {
  try {
    const usuario = await db('usuarios').where({ id: req.user.id }).first()
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }
    const empresa = await db('empresas').where({ id: usuario.empresa_id }).first()
    res.json({ usuario: datosPublicos(usuario, empresa) })
  } catch (err) {
    console.error('[auth] Error en /me:', err.message)
    res.status(500).json({ error: 'No se ha podido obtener el usuario' })
  }
})

module.exports = router
