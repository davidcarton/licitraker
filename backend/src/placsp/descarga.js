const axios = require('axios')
const xml2js = require('xml2js')
const https = require('https')
const cache = require('../cache')
const logger = require('../utils/logger')
const { extraerDatos, extraerEntradas, encontrarSiguienteURL } = require('./parser')
const { esObra, estaEnPlazo } = require('./filtros')

const ATOM_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom'
const MAX_PAGINAS = 5
const OBRAS_OBJETIVO = 300
const PAUSA_MS = 800

// Calcula la próxima actualización programada en hora española (07:00, 12:00 ó 18:00)
function getProximaActualizacion() {
  const ahora = new Date()
  const esStr = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' })
  const es = new Date(esStr)

  let proxima = [7, 12, 18]
    .map(h => { const d = new Date(es); d.setHours(h, 0, 0, 0); return d })
    .find(d => d > es)

  if (!proxima) {
    proxima = new Date(es)
    proxima.setDate(proxima.getDate() + 1)
    proxima.setHours(7, 0, 0, 0)
  }

  return new Date(proxima.getTime() - es.getTime() + ahora.getTime())
}

async function descargarYParsear(url) {
  const response = await axios.get(url, {
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 15000,
    responseType: 'text',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/atom+xml,application/xml,text/xml,*/*',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Cache-Control': 'no-cache',
    },
  })
  return xml2js.parseStringPromise(response.data, {
    explicitArray: false,
    ignoreAttrs: false,
    tagNameProcessors: [xml2js.processors.stripPrefix],
  })
}

function ordenarPorFechaLimite(lista) {
  return lista.sort((a, b) => {
    if (!a.fechaLimite && !b.fechaLimite) return 0
    if (!a.fechaLimite) return 1
    if (!b.fechaLimite) return -1
    return new Date(a.fechaLimite) - new Date(b.fechaLimite)
  })
}

async function descargarYFiltrar(filtroFn, maxResultados, maxPaginas = MAX_PAGINAS) {
  let resultados = []
  let url = ATOM_URL
  let paginas = 0

  while (url && paginas < maxPaginas) {
    let result
    try {
      result = await descargarYParsear(url)
    } catch (e) {
      logger.warn('placsp', `Error en página ${paginas + 1}: ${e.message}`)
      break
    }

    const pagina = extraerEntradas(result).filter(filtroFn).map(extraerDatos).filter(Boolean)
    resultados = resultados.concat(pagina)
    paginas++

    if (resultados.length >= maxResultados) break

    url = encontrarSiguienteURL(result)
    if (url) await new Promise(r => setTimeout(r, PAUSA_MS))
  }

  return resultados
}

async function descargarYProcesar() {
  try {
    console.log('[placsp] Descargando ATOM...')
    const obras = await descargarYFiltrar(
      entry => esObra(entry) && estaEnPlazo(entry),
      OBRAS_OBJETIVO
    )
    cache.datos = ordenarPorFechaLimite(obras)
    cache.ultimaActualizacion = new Date().toISOString()
    cache.proximaActualizacion = getProximaActualizacion().toISOString()
    cache.ultimoTotalDescargado = obras.length
    console.log(`[placsp] OK — ${obras.length} obras en plazo`)
  } catch (err) {
    logger.error('placsp', 'Error en descarga: ' + err.message)
  }
}

module.exports = { descargarYFiltrar, descargarYProcesar, getProximaActualizacion }
