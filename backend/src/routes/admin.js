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

router.get('/negocio', async (req, res) => {
  try {
    const baseQuery = () => db('empresas').whereNot('plan', 'admin')

    const [{ count: totalEmpresas }] = await baseQuery().count('id as count')
    const [{ count: totalActivas }] = await baseQuery().where('activa', true).count('id as count')
    const [{ count: totalInactivas }] = await baseQuery().where('activa', false).count('id as count')

    const haceSieteDias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [{ count: altasEstaSemana }] = await baseQuery()
      .where('created_at', '>=', haceSieteDias)
      .count('id as count')

    const [{ suma }] = await baseQuery().where('activa', true).sum({ suma: 'precio_mensual' })

    const filasPlan = await baseQuery()
      .where('activa', true)
      .groupBy('plan')
      .select('plan')
      .count('id as empresasActivas')
      .sum({ mrr: 'precio_mensual' })
      .orderBy('empresasActivas', 'desc')

    const desglosePorPlan = filasPlan.map(fila => ({
      plan: fila.plan,
      empresasActivas: Number(fila.empresasActivas),
      mrr: Number(fila.mrr) || 0,
    }))

    const ahora = new Date()
    const crecimientoMensual = []
    for (let i = 5; i >= 0; i--) {
      const inicio = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
      const fin = new Date(ahora.getFullYear(), ahora.getMonth() - i + 1, 1)
      const [{ count: altas }] = await baseQuery()
        .where('created_at', '>=', inicio)
        .where('created_at', '<', fin)
        .count('id as count')
      const etiqueta = inicio.toLocaleString('es-ES', { month: 'short', year: '2-digit' })
      crecimientoMensual.push({
        mes: `${inicio.getFullYear()}-${String(inicio.getMonth() + 1).padStart(2, '0')}`,
        etiqueta,
        altas: Number(altas),
      })
    }

    res.json({
      totalEmpresas: Number(totalEmpresas),
      totalActivas: Number(totalActivas),
      totalInactivas: Number(totalInactivas),
      altasEstaSemana: Number(altasEstaSemana),
      mrr: Number(suma) || 0,
      desglosePorPlan,
      crecimientoMensual,
    })
  } catch (err) {
    logger.error('admin', 'Error al obtener visión de negocio: ' + err.message)
    res.status(500).json({ error: 'No se ha podido obtener la visión de negocio' })
  }
})

router.get('/logs', (req, res) => {
  res.json({ logs: logger.getEntradas() })
})

module.exports = router
