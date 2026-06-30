const MAX_MUESTRAS = 100
const muestrasLatencia = []

function registrarLatencia(ms) {
  muestrasLatencia.push(ms)
  if (muestrasLatencia.length > MAX_MUESTRAS) muestrasLatencia.shift()
}

function obtenerLatenciaMedia() {
  if (muestrasLatencia.length === 0) return null
  const suma = muestrasLatencia.reduce((acc, v) => acc + v, 0)
  return { latenciaMediaMs: Math.round(suma / muestrasLatencia.length), muestras: muestrasLatencia.length }
}

function medirLatencia(req, res, next) {
  const inicio = Date.now()
  res.on('finish', () => registrarLatencia(Date.now() - inicio))
  next()
}

const CAUSAS = {
  401: (tieneToken) => tieneToken ? 'sesión expirada' : 'sin autenticación',
  403: () => 'acceso denegado',
  404: () => 'ruta no encontrada',
  405: () => 'método no permitido',
}

function registrarPeticionesFallidas(logger) {
  return (req, res, next) => {
    const inicio = Date.now()
    res.on('finish', () => {
      const status = res.statusCode
      if (status < 400) return

      const ms = Date.now() - inicio
      const ip = (req.headers['x-forwarded-for'] || req.ip || '?').split(',')[0].trim()
      const tieneToken = !!req.headers.authorization
      const causa = CAUSAS[status] ? CAUSAS[status](tieneToken) : null
      const sufijo = causa ? ` (${causa})` : ''
      const msg = `${req.method} ${req.originalUrl} → ${status}${sufijo}`
      const extra = { method: req.method, url: req.originalUrl, status, ms, ip }

      if (status === 401) {
        // 401 son ruido esperado (sesión expirada / sin token): nivel info
        logger.info('http', msg, extra)
      } else if (status === 403) {
        logger.warn('http', msg, extra)
      } else if (status === 404) {
        logger.warn('http', msg, extra)
      } else if (status >= 500) {
        const ua = (req.headers['user-agent'] || '').slice(0, 100)
        logger.error('http', msg, { ...extra, ua })
      } else {
        logger.warn('http', msg, extra)
      }
    })
    next()
  }
}

module.exports = { medirLatencia, registrarPeticionesFallidas, obtenerLatenciaMedia }
