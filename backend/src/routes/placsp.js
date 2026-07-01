const router = require('express').Router()
const cache = require('../cache')
const logger = require('../utils/logger')
const { descargarYFiltrar, descargarYProcesar } = require('../placsp/descarga')
const { estaEnPlazo, cpvCoincide } = require('../placsp/filtros')

router.get('/licitaciones', async (req, res) => {
  try {
    if (req.query.refresh === '1' || !cache.datos) {
      await descargarYProcesar()
    }

    if (!cache.datos) {
      return res.json({ error: 'No hay datos disponibles todavía', licitaciones: [] })
    }

    res.json({
      total: cache.datos.length,
      actualizacion: cache.ultimaActualizacion,
      proximaActualizacion: cache.proximaActualizacion,
      licitaciones: cache.datos,
    })
  } catch (err) {
    logger.error('api', 'Error en licitaciones: ' + err.message)
    res.json({ error: err.message || 'Error al obtener licitaciones', licitaciones: [] })
  }
})

router.get('/buscar-cpv', async (req, res) => {
  try {
    const codigo = (req.query.codigo || '').trim()
    if (!codigo) {
      return res.json({ error: 'Debes indicar un código CPV', licitaciones: [] })
    }

    const resultados = await descargarYFiltrar(
      entry => estaEnPlazo(entry) && cpvCoincide(entry, codigo),
      50
    )

    res.json({ total: resultados.length, licitaciones: resultados.slice(0, 50) })
  } catch (err) {
    logger.error('api', 'Error en buscar-cpv: ' + err.message)
    res.json({ error: err.message || 'Error al buscar por CPV', licitaciones: [] })
  }
})

router.get('/estado', (req, res) => {
  res.json({
    estado: 'ok',
    ultimaActualizacion: cache.ultimaActualizacion,
    proximaActualizacion: cache.proximaActualizacion,
    totalLicitaciones: cache.datos ? cache.datos.length : 0,
    servidor: new Date().toISOString(),
  })
})

module.exports = router
