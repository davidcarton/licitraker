const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const requireAdmin = require('../middleware/admin')
const logger = require('../utils/logger')
const cache = require('../cache')

router.use(auth, requireAdmin)

// ─── Stats del sistema (lo que Admin.jsx consume) ──────────────────────────────

router.get('/stats', async (req, res) => {
  try {
    const [{ count: totalEmpresas }] = await db('empresas').count('id as count')
    const [{ count: totalUsuarios }] = await db('usuarios').count('id as count')
    const [{ count: totalGuardadas }] = await db('licitaciones_guardadas').count('id as count')

    const logs = logger.getEntradas()
    const errores = logs.filter(l => l.nivel === 'error' || l.nivel === 'warn')

    res.json({
      totalLicitaciones: cache.datos ? cache.datos.length : 0,
      totalEmpresas: Number(totalEmpresas),
      totalUsuarios: Number(totalUsuarios),
      totalGuardadas: Number(totalGuardadas),
      ultimaActualizacion: cache.ultimaActualizacion,
      proximaActualizacion: cache.proximaActualizacion,
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version,
      memoria: process.memoryUsage(),
      logs: errores.slice(0, 50),
    })
  } catch (err) {
    logger.error('admin', 'Error al obtener stats: ' + err.message)
    res.status(500).json({ error: 'No se ha podido obtener el estado del sistema' })
  }
})

// ─── Estado del sistema (endpoint legacy) ─────────────────────────────────────

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

// ─── Logs en memoria ──────────────────────────────────────────────────────────

router.get('/logs', (req, res) => {
  res.json({ logs: logger.getEntradas() })
})

// ─── Listado de empresas con métricas ────────────────────────────────────────

router.get('/empresas', async (req, res) => {
  try {
    const empresas = await db('empresas').select('*').orderBy('created_at', 'desc')

    const resultado = await Promise.all(empresas.map(async (e) => {
      const [{ count: usuarios }] = await db('usuarios')
        .where({ empresa_id: e.id }).count('id as count')
      const [{ count: guardadas }] = await db('licitaciones_guardadas')
        .where({ empresa_id: e.id }).count('id as count')
      return {
        ...e,
        total_usuarios: Number(usuarios),
        total_guardadas: Number(guardadas),
      }
    }))

    res.json({ empresas: resultado })
  } catch (err) {
    logger.error('admin', 'Error al listar empresas: ' + err.message)
    res.status(500).json({ error: 'No se han podido cargar las empresas' })
  }
})

module.exports = router
