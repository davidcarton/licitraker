const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')
const logger = require('../utils/logger')

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

module.exports = router
