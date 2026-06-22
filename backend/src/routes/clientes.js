const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')
const logger = require('../utils/logger')
const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')

router.use(auth, requireAdmin)

router.get('/', async (req, res) => {
  try {
    const empresas = await db('empresas')
      .whereNot('plan', 'admin')
      .select('id', 'nombre', 'plan', 'precio_mensual', 'activa', 'created_at')
      .orderBy('created_at', 'desc')

    res.json({
      empresas: empresas.map(e => ({
        id: e.id,
        nombre: e.nombre,
        plan: e.plan,
        precioMensual: e.precio_mensual != null ? Number(e.precio_mensual) : null,
        activa: e.activa,
        createdAt: e.created_at,
      })),
    })
  } catch (err) {
    logger.error('clientes', 'Error al listar clientes: ' + err.message)
    res.status(500).json({ error: 'No se han podido obtener los clientes' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const empresa = await db('empresas')
      .whereNot('plan', 'admin')
      .where('id', req.params.id)
      .first()

    if (!empresa) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    const usuarios = await db('usuarios')
      .where('empresa_id', empresa.id)
      .select('id', 'nombre', 'email', 'rol', 'activo')

    const preferencias = await db('preferencias')
      .where('empresa_id', empresa.id)
      .first()

    res.json({
      id: empresa.id,
      nombre: empresa.nombre,
      plan: empresa.plan,
      precioMensual: empresa.precio_mensual != null ? Number(empresa.precio_mensual) : null,
      activa: empresa.activa,
      createdAt: empresa.created_at,
      usuarios,
      preferencias: preferencias ? {
        tiposObra: preferencias.tipos_obra,
        provincias: preferencias.provincias,
        importeMin: preferencias.importe_min != null ? Number(preferencias.importe_min) : null,
        importeMax: preferencias.importe_max != null ? Number(preferencias.importe_max) : null,
        frecuenciaAlerta: preferencias.frecuencia_alerta,
      } : null,
    })
  } catch (err) {
    logger.error('clientes', 'Error al obtener cliente: ' + err.message)
    res.status(500).json({ error: 'No se ha podido obtener el cliente' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const empresa = await db('empresas').whereNot('plan', 'admin').where('id', req.params.id).first()
    if (!empresa) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    const cambios = {}
    if (req.body.plan !== undefined) {
      const plan = String(req.body.plan).trim()
      if (!plan) {
        return res.status(400).json({ error: 'El plan no puede estar vacío' })
      }
      if (plan.length > 50) {
        return res.status(400).json({ error: 'El plan no puede tener más de 50 caracteres' })
      }
      cambios.plan = plan
    }
    if (req.body.precio_mensual !== undefined) {
      const precio = req.body.precio_mensual
      if (precio === null || precio === '') {
        cambios.precio_mensual = null
      } else {
        const num = Number(precio)
        if (isNaN(num) || num < 0) {
          return res.status(400).json({ error: 'El precio mensual debe ser un número positivo' })
        }
        cambios.precio_mensual = num
      }
    }
    if (req.body.activa !== undefined) {
      cambios.activa = Boolean(req.body.activa)
    }

    if (Object.keys(cambios).length === 0) {
      return res.status(400).json({ error: 'No se ha indicado ningún cambio' })
    }

    cambios.updated_at = db.fn.now()
    await db('empresas').where('id', empresa.id).update(cambios)

    res.json({ ok: true })
  } catch (err) {
    logger.error('clientes', 'Error al actualizar cliente: ' + err.message)
    res.status(500).json({ error: 'No se ha podido actualizar el cliente' })
  }
})

router.patch('/:id/usuarios/:usuarioId/password', async (req, res) => {
  try {
    const empresa = await db('empresas').whereNot('plan', 'admin').where('id', req.params.id).first()
    if (!empresa) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    const usuario = await db('usuarios')
      .where('id', req.params.usuarioId)
      .where('empresa_id', empresa.id)
      .first()
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const { password } = req.body || {}
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    await db('usuarios').where('id', usuario.id).update({ password_hash: passwordHash })

    res.json({ ok: true })
  } catch (err) {
    logger.error('clientes', 'Error al resetear contraseña: ' + err.message)
    res.status(500).json({ error: 'No se ha podido actualizar la contraseña' })
  }
})

router.post('/:id/email', async (req, res) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({ error: 'El servicio de email no está configurado en el servidor' })
    }

    const empresa = await db('empresas').whereNot('plan', 'admin').where('id', req.params.id).first()
    if (!empresa) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }

    const { asunto, cuerpo } = req.body || {}
    if (!asunto || !String(asunto).trim()) {
      return res.status(400).json({ error: 'El asunto es obligatorio' })
    }
    if (!cuerpo || !String(cuerpo).trim()) {
      return res.status(400).json({ error: 'El mensaje es obligatorio' })
    }

    const usuarios = await db('usuarios').where('empresa_id', empresa.id).select('email', 'nombre')
    if (usuarios.length === 0) {
      return res.status(400).json({ error: 'Esta empresa no tiene usuarios a los que enviar el email' })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })

    const destinatarios = usuarios.map(u => u.email).join(', ')

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: destinatarios,
      subject: String(asunto).trim(),
      text: String(cuerpo).trim(),
    })

    logger.info?.('clientes', `Email enviado a ${empresa.nombre} (${destinatarios})`)
    res.json({ ok: true })
  } catch (err) {
    logger.error('clientes', 'Error al enviar email: ' + err.message)
    res.status(500).json({ error: 'No se ha podido enviar el email' })
  }
})

module.exports = router
