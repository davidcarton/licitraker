const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')
const logger = require('../utils/logger')
const cache = require('../cache')

router.use(auth, requireAdmin)

router.get('/estado', async (req, res) => {
  try {
    const [{ count: totalEmpresas }] = await db('empresas').count('id as count')
    const [{ count: totalUsuarios }] = await db('usuarios').count('id as count')
    const [{ count: totalGuardadas }] = await db('licitaciones_guardadas').count('id as count')

    res.json({
      servidor: {
        fecha: new Date().toISOString(),
        uptimeSegundos: Math.round(process.uptime()),
        memoria: process.memoryUsage(),
        nodeVersion: process.version,
      },
      cache: {
        totalLicitaciones: cache.datos ? cache.datos.length : 0,
        ultimaActualizacion: cache.ultimaActualizacion,
        proximaActualizacion: cache.proximaActualizacion,
      },
      base_datos: {
        empresas: Number(totalEmpresas),
        usuarios: Number(totalUsuarios),
        licitacionesGuardadas: Number(totalGuardadas),
      },
    })
  } catch (err) {
    logger.error('admin', 'Error al obtener estado: ' + err.message)
    res.status(500).json({ error: 'No se ha podido obtener el estado del sistema' })
  }
})

router.get('/logs', (req, res) => {
  res.json({ logs: logger.getEntradas() })
})

module.exports = router
