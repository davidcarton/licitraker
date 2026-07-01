const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const logger = require('../utils/logger')
const { obtenerPliegosPDF } = require('../utils/pliegos')
const { generarResumen, construirPromptResumen } = require('../services/ia')

router.use(auth)

router.post('/resumen-ia', async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'El servicio de resumen con IA no está configurado' })
    }

    const { titulo, organismo, importe, fechaLimite, cpv, enlace, expediente } = req.body || {}
    const empresa_id = req.user.empresa_id

    // Comprobar caché en BD antes de llamar a la IA
    if (expediente) {
      const cacheado = await db('resumenes_ia').where({ expediente, empresa_id }).first()
      if (cacheado) {
        if (!cacheado.titulo && titulo) {
          await db('resumenes_ia').where({ expediente, empresa_id }).update({
            titulo, organismo,
            importe: importe ?? cacheado.importe,
            fecha_limite: fechaLimite ?? cacheado.fecha_limite,
          })
        }
        return res.json({ resumen: cacheado.resumen })
      }
    }

    let pdfs = []
    try { pdfs = await obtenerPliegosPDF(enlace) } catch (e) {
      logger.warn('pliegos', `Error al descargar pliegos: ${e.message}`)
    }

    const prompt = construirPromptResumen({ titulo, organismo, importe, fechaLimite, cpv, enlace, hayPliegos: pdfs.length > 0 })
    const resultado = await generarResumen(process.env.ANTHROPIC_API_KEY, prompt, pdfs)

    if (expediente) {
      await db('resumenes_ia')
        .insert({
          expediente, empresa_id, resumen: resultado.text, pliegos_encontrados: pdfs.length,
          titulo, organismo, importe, fecha_limite: fechaLimite,
          tokens_input: resultado.input, tokens_output: resultado.output,
          coste_euros: resultado.costeEuros ?? null,
        })
        .onConflict(['expediente', 'empresa_id']).merge()
    }

    res.json({ resumen: resultado.text })
  } catch (err) {
    logger.error('api', 'Error en resumen-ia: ' + err.message)
    res.status(500).json({ error: 'No se ha podido generar el resumen con IA' })
  }
})

router.get('/resumenes-ia', async (req, res) => {
  try {
    const esSuperadmin = req.user.rol === 'superadmin'
    let query = db('resumenes_ia')
      .select(
        'resumenes_ia.id', 'resumenes_ia.expediente', 'resumenes_ia.resumen',
        'resumenes_ia.titulo', 'resumenes_ia.organismo', 'resumenes_ia.importe',
        'resumenes_ia.fecha_limite', 'resumenes_ia.pliegos_encontrados',
        'resumenes_ia.coste_euros', 'resumenes_ia.created_at',
      )
      .orderBy('resumenes_ia.created_at', 'desc')

    if (esSuperadmin) {
      query = query
        .leftJoin('empresas', 'resumenes_ia.empresa_id', 'empresas.id')
        .select('empresas.nombre as empresa_nombre')
    } else {
      query = query.where('resumenes_ia.empresa_id', req.user.empresa_id)
    }

    res.json({ resumenes: await query, esSuperadmin })
  } catch (err) {
    logger.error('api', 'Error al listar resumenes-ia: ' + err.message)
    res.status(500).json({ error: 'No se han podido cargar los resúmenes' })
  }
})

// Devuelve null (200) en lugar de 404 cuando no existe aún —
// no encontrar resumen es el caso esperado la primera vez.
router.get('/resumenes-ia/:expediente', async (req, res) => {
  try {
    const item = await db('resumenes_ia')
      .where({ expediente: req.params.expediente })
      .first()
    res.json(item || null)
  } catch (err) {
    logger.error('api', 'Error al obtener resumen-ia: ' + err.message)
    res.status(500).json({ error: 'No se ha podido cargar el resumen' })
  }
})

router.delete('/resumenes-ia/:expediente', async (req, res) => {
  try {
    const filtro = req.user.rol === 'superadmin'
      ? { expediente: req.params.expediente }
      : { expediente: req.params.expediente, empresa_id: req.user.empresa_id }
    const borrados = await db('resumenes_ia').where(filtro).delete()
    if (borrados === 0) return res.status(404).json({ error: 'Resumen no encontrado' })
    res.json({ ok: true })
  } catch (err) {
    logger.error('api', 'Error al eliminar resumen-ia: ' + err.message)
    res.status(500).json({ error: 'No se ha podido eliminar el resumen' })
  }
})

router.delete('/mi-cuenta', async (req, res) => {
  try {
    const empresa = await db('empresas')
      .where('id', req.user.empresa_id)
      .whereNot('plan', 'admin')
      .first()
    if (!empresa) return res.status(404).json({ error: 'Cuenta no encontrada' })
    await db('empresas').where('id', empresa.id).del()
    res.json({ ok: true })
  } catch (err) {
    logger.error('api', 'Error al eliminar cuenta: ' + err.message)
    res.status(500).json({ error: 'No se ha podido eliminar la cuenta' })
  }
})

module.exports = router
