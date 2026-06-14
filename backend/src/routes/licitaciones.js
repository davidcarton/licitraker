const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')

const ESTADOS_VALIDOS = ['guardada', 'en_estudio', 'presentada', 'descartada', 'ganada', 'perdida']

router.use(auth)

router.get('/', async (req, res) => {
  try {
    const guardadas = await db('licitaciones_guardadas')
      .where({ empresa_id: req.user.empresa_id })
      .orderBy('updated_at', 'desc')

    res.json({ guardadas })
  } catch (err) {
    console.error('[guardadas] Error al listar:', err.message)
    res.status(500).json({ error: 'No se han podido cargar las licitaciones guardadas' })
  }
})

router.post('/guardar', async (req, res) => {
  try {
    const { expediente, titulo, organismo, importe, fechaLimite, provincia, municipio, cpv, enlace } = req.body || {}
    if (!expediente) {
      return res.status(400).json({ error: 'Falta el expediente de la licitación' })
    }

    const [guardada] = await db('licitaciones_guardadas')
      .insert({
        empresa_id: req.user.empresa_id,
        licitacion_id: expediente,
        titulo: titulo || null,
        organismo: organismo || null,
        importe: importe || null,
        fecha_limite: fechaLimite || null,
        provincia: provincia || null,
        municipio: municipio || null,
        cpv: cpv || null,
        enlace: enlace || null,
        estado: 'guardada'
      })
      .onConflict(['empresa_id', 'licitacion_id'])
      .merge({
        titulo: titulo || null,
        organismo: organismo || null,
        importe: importe || null,
        fecha_limite: fechaLimite || null,
        provincia: provincia || null,
        municipio: municipio || null,
        cpv: cpv || null,
        enlace: enlace || null,
        updated_at: db.fn.now()
      })
      .returning('*')

    res.status(201).json({ guardada })
  } catch (err) {
    console.error('[guardadas] Error al guardar:', err.message)
    res.status(500).json({ error: 'No se ha podido guardar la licitación' })
  }
})

router.patch('/:id/estado', async (req, res) => {
  try {
    const { estado } = req.body || {}
    if (!ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' })
    }

    const [actualizada] = await db('licitaciones_guardadas')
      .where({ id: req.params.id, empresa_id: req.user.empresa_id })
      .update({ estado, updated_at: db.fn.now() })
      .returning('*')

    if (!actualizada) {
      return res.status(404).json({ error: 'Licitación guardada no encontrada' })
    }

    res.json({ guardada: actualizada })
  } catch (err) {
    console.error('[guardadas] Error al actualizar estado:', err.message)
    res.status(500).json({ error: 'No se ha podido actualizar el estado' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const eliminadas = await db('licitaciones_guardadas')
      .where({ id: req.params.id, empresa_id: req.user.empresa_id })
      .del()

    if (!eliminadas) {
      return res.status(404).json({ error: 'Licitación guardada no encontrada' })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('[guardadas] Error al eliminar:', err.message)
    res.status(500).json({ error: 'No se ha podido eliminar la licitación guardada' })
  }
})

module.exports = router
