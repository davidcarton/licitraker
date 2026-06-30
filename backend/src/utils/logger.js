const MAX_ENTRADAS = 500

const entradas = []

function registrar(nivel, contexto, mensaje, extra = {}) {
  entradas.unshift({ fecha: new Date().toISOString(), nivel, contexto, mensaje, ...extra })
  if (entradas.length > MAX_ENTRADAS) entradas.pop()

  const linea = `[${contexto}] ${mensaje}`
  if (nivel === 'error') console.error(linea)
  else if (nivel === 'warn') console.warn(linea)
  else console.log(linea)
}

module.exports = {
  error: (contexto, mensaje, extra) => registrar('error', contexto, mensaje, extra),
  warn: (contexto, mensaje, extra) => registrar('warn', contexto, mensaje, extra),
  info: (contexto, mensaje, extra) => registrar('info', contexto, mensaje, extra),
  getEntradas: () => entradas,
}
