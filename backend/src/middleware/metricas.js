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

function registrarPeticionesFallidas(logger) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        logger.warn('http', `${req.method} ${req.originalUrl} → ${res.statusCode}`)
      }
    })
    next()
  }
}

module.exports = { medirLatencia, registrarPeticionesFallidas, obtenerLatenciaMedia }
