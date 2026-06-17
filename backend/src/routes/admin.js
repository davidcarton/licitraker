const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')
const logger = require('../utils/logger')
const cache = require('../cache')
const { obtenerCPU, obtenerMemoriaSistema, obtenerDisco, obtenerDocker } = require('../sistema')
const { obtenerLatenciaMedia } = require('../middleware/metricas')

router.use(auth, requireAdmin)

router.get('/estado', async (req, res) => {
  try {
    const [{ count: totalEmpresas }] = await db('empresas').count('id as count')
    const [{ count: totalUsuarios }] = await db('usuarios').count('id as count')
    const [{ count: totalGuardadas }] = await db('licitaciones_guardadas').count('id as count')

    const latencia = obtenerLatenciaMedia()

    res.json({
      servidor: {
        fecha: new Date().toISOString(),
        uptimeSegundos: Math.round(process.uptime()),
        memoria: process.memoryUsage(),
        nodeVersion: process.version,
      },
      sistemaOperativo: {
        cpu: obtenerCPU(),
        memoria: obtenerMemoriaSistema(),
        disco: obtenerDisco(),
      },
      docker: obtenerDocker(),
      placsp: {
        ultimaActualizacion: cache.ultimaActualizacion,
        proximaActualizacion: cache.proximaActualizacion,
        ultimoTotalDescargado: cache.ultimoTotalDescargado,
      },
      api: {
        latenciaMediaMs: latencia ? latencia.latenciaMediaMs : null,
        muestras: latencia ? latencia.muestras : 0,
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
