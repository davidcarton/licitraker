const cron = require('node-cron')
const cache = require('./cache')
const { descargarYProcesar } = require('./placsp/descarga')

const ZONA = { timezone: 'Europe/Madrid' }

function iniciarCron() {
  // Descarga completa: L-V a las 07:00, 12:00 y 18:00; sábados a las 07:00
  cron.schedule('0 7 * * 1-5',  () => { console.log('[CRON 07:00] Actualizando licitaciones'); descargarYProcesar() }, ZONA)
  cron.schedule('0 12 * * 1-5', () => { console.log('[CRON 12:00] Actualizando licitaciones'); descargarYProcesar() }, ZONA)
  cron.schedule('0 18 * * 1-5', () => { console.log('[CRON 18:00] Actualizando licitaciones'); descargarYProcesar() }, ZONA)
  cron.schedule('0 7 * * 6',    () => { console.log('[CRON SAB 07:00] Actualizando licitaciones'); descargarYProcesar() }, ZONA)

  // Limpieza horaria: eliminar licitaciones ya expiradas del caché
  cron.schedule('0 * * * *', () => {
    if (!cache.datos) return
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const antes = cache.datos.length
    cache.datos = cache.datos.filter(l => !l.fechaLimite || new Date(l.fechaLimite + 'T00:00:00') >= hoy)
    const eliminadas = antes - cache.datos.length
    if (eliminadas > 0) {
      console.log(`[cache] ${eliminadas} licitaciones expiradas. Quedan ${cache.datos.length}.`)
    }
  }, ZONA)
}

module.exports = { iniciarCron }
