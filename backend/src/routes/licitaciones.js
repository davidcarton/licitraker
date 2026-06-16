const router = require('express').Router()

router.get('/', (req, res) => res.json({ msg: 'TODO' }))
router.post('/guardar', (req, res) => res.json({ msg: 'TODO' }))
router.patch('/:id/estado', (req, res) => res.json({ msg: 'TODO' }))
router.delete('/:id', (req, res) => res.json({ msg: 'TODO' }))

module.exports = router
