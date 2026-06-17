require('dotenv').config()

const express = require('express')
const axios = require('axios')
const xml2js = require('xml2js')
const cors = require('cors')
const https = require('https')
const os = require('os')
const path = require('path')
const cron = require('node-cron')
const Anthropic = require('@anthropic-ai/sdk')

const authRoutes = require('./src/routes/auth')
const licitacionesRoutes = require('./src/routes/licitaciones')
const adminRoutes = require('./src/routes/admin')
const logger = require('./src/utils/logger')
const cache = require('./src/cache')
const { medirLatencia, registrarPeticionesFallidas } = require('./src/middleware/metricas')

const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)

const app = express()
app.use(cors(corsOrigins.length ? { origin: corsOrigins, credentials: true } : { origin: true, credentials: true }))

app.use(express.json())
app.use(medirLatencia)
app.use(registrarPeticionesFallidas(logger))
app.use('/api/auth', authRoutes)
app.use('/api/licitaciones-guardadas', licitacionesRoutes)
app.use('/api/admin', adminRoutes)

const ATOM_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom'

// ─── Próxima actualización ─────────────────────────────────────────────────────

function getProximaActualizacion() {
  const ahora = new Date()
  // Convertir a hora española
  const esStr = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Madrid' })
  const es = new Date(esStr)
  const hoy = new Date(es)

  const horarios = [7, 12, 18]
  let proxima = null

  for (const h of horarios) {
    const candidato = new Date(hoy)
    candidato.setHours(h, 0, 0, 0)
    if (candidato > es) {
      proxima = candidato
      break
    }
  }

  if (!proxima) {
    // Mañana a las 07:00
    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)
    manana.setHours(7, 0, 0, 0)
    proxima = manana
  }

  // Ajustar la diferencia UTC↔Madrid para devolver Date en UTC
  const offsetMs = proxima.getTime() - es.getTime() + ahora.getTime()
  return new Date(offsetMs)
}

// ─── Helpers de parsing ────────────────────────────────────────────────────────

function getText(val) {
  if (val == null) return null
  if (typeof val === 'string') return val.trim() || null
  if (typeof val === 'object') {
    if (val['#text']) return String(val['#text']).trim()
    if (val._) return String(val._).trim()
    if (val.InnerText) return String(val.InnerText).trim()
  }
  return null
}

function getFloat(val) {
  if (val == null) return null
  if (typeof val === 'object' && val['#text']) val = val['#text']
  if (typeof val === 'object' && val._) val = val._
  const n = parseFloat(String(val))
  return isNaN(n) ? null : n
}

function getLink(linkVal, entryId) {
  const fallback = entryId ? String(entryId) : '#'
  if (!linkVal) return fallback
  if (Array.isArray(linkVal)) {
    const alt = linkVal.find(l => l && l.$ && l.$.rel === 'alternate')
    if (alt && alt.$) return alt.$.href || fallback
    const first = linkVal[0]
    if (first && first.$) return first.$.href || fallback
    return fallback
  }
  if (typeof linkVal === 'object') {
    if (linkVal.$) return linkVal.$.href || fallback
    if (linkVal._) return String(linkVal._)
    return fallback
  }
  return String(linkVal) || fallback
}

function getCPVFromClassification(classification) {
  if (!classification) return null
  const arr = [].concat(classification)
  const codes = arr.map(c => {
    const icc = c && c.ItemClassificationCode
    if (!icc) return null
    if (typeof icc === 'string') return icc
    return icc._ || icc['#text'] || null
  }).filter(Boolean)
  return codes.length > 0 ? codes.join(' ') : null
}

function extraerUbicacion(entry) {
  const loc = entry?.ContractFolderStatus?.ProcurementProject?.RealizedLocation

  // Provincia: RealizedLocation.CountrySubentity (limpiar variantes bilingües "Valencia/València")
  let provincia = getText(loc?.CountrySubentity) || ''
  if (provincia.includes('/')) {
    provincia = provincia.split('/')[0].trim()
  }

  // Municipio: RealizedLocation.Address.CityName
  let municipio = getText(loc?.Address?.CityName) || ''
  if (municipio === municipio.toUpperCase() && municipio.length > 0) {
    municipio = municipio.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    municipio = municipio.replace(/\b(De|Del|La|Los|Las|El|Y)\b/g, m => m.toLowerCase())
  }

  // Si municipio y provincia coinciden, mostrar solo provincia
  if (municipio.toLowerCase() === provincia.toLowerCase()) {
    municipio = ''
  }

  return { provincia: provincia || null, municipio: municipio || null }
}

function extraerDatos(entry) {
  try {
    const cfs = entry.ContractFolderStatus
    if (!cfs) return null
    const proj = cfs.ProcurementProject || {}
    const budget = proj.BudgetAmount || {}
    const process = cfs.TenderingProcess || {}
    const deadline = process.TenderSubmissionDeadlinePeriod || {}
    const party = ((cfs.LocatedContractingParty || {}).Party) || {}
    const partyName = party.PartyName || {}

    const titulo = getText(proj.Name)
    const organismo = getText(partyName.Name)

    return {
      titulo,
      organismo,
      importe: getFloat(budget.TaxExclusiveAmount),
      fechaLimite: getText(deadline.EndDate) || null,
      cpv: getCPVFromClassification(proj.RequiredCommodityClassification),
      tipoContrato: getText(proj.TypeCode) || null,
      enlace: getLink(entry.link, getText(entry.id)),
      expediente: getText(cfs.ContractFolderID),
      fechaPublicacion: getText(entry.updated) || getText(entry.published) || null,
      ...extraerUbicacion(entry),
    }
  } catch {
    return null
  }
}

// ─── Filtros de obra ────────────────────────────────────────────────────────────

// TypeCode (valores reales observados en el feed PLACSP):
// 1=Suministros, 2=Servicios, 3=Obras, 8=Desconocido,
// 22=Concesión de servicios, 50=Concesión mixta
function tieneCPV45(entry) {
  const proj = entry?.ContractFolderStatus?.ProcurementProject
  const cpv = getCPVFromClassification(proj?.RequiredCommodityClassification)
  if (!cpv) return false
  return cpv.split(/\s+/).some(c => c.startsWith('45'))
}

// FILTRO — El CPV de la licitación contiene el código buscado (coincidencia parcial)
function cpvCoincide(entry, codigo) {
  const proj = entry?.ContractFolderStatus?.ProcurementProject
  const cpvStr = getCPVFromClassification(proj?.RequiredCommodityClassification)
  if (!cpvStr) return false
  return cpvStr.includes(codigo)
}

// FILTRO 1 — Es una obra
function esObra(entry) {
  const typeCode = getText(entry?.ContractFolderStatus?.ProcurementProject?.TypeCode) || ''

  if (typeCode === '3') return true               // Obras puras
  if (typeCode === '1' || typeCode === '22') return false // Suministros / concesión servicios

  // '2' (servicios), '50' (concesión mixta), '8' (desconocido), '' (sin tipo)
  // y cualquier otro código no contemplado → incluir solo si hay CPV 45
  return tieneCPV45(entry)
}

// FILTRO 2 — Está en vigor hoy
function estaEnPlazo(entry) {
  const fechaLimite = getText(entry?.ContractFolderStatus?.TenderingProcess?.TenderSubmissionDeadlinePeriod?.EndDate)
  if (!fechaLimite) return true
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(fechaLimite + 'T00:00:00')
  return limite >= hoy
}

async function descargarYParsear(url) {
  const response = await axios.get(url, {
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 15000,
    responseType: 'text',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'Accept': 'application/atom+xml,application/xml,text/xml,*/*',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Cache-Control': 'no-cache',
    }
  })
  return xml2js.parseStringPromise(response.data, {
    explicitArray: false,
    ignoreAttrs: false,
    tagNameProcessors: [xml2js.processors.stripPrefix]
  })
}

function extraerEntradas(result) {
  const entries = result && result.feed && result.feed.entry
  if (!entries) return []
  return [].concat(entries)
}

function encontrarSiguienteURL(result) {
  const links = result && result.feed && result.feed.link
  if (!links) return null
  const arr = [].concat(links)
  const next = arr.find(l => l && l.$ && l.$.rel === 'next')
  return next ? next.$.href : null
}

function ordenar(lista) {
  return lista.sort((a, b) => {
    if (!a.fechaLimite && !b.fechaLimite) return 0
    if (!a.fechaLimite) return 1
    if (!b.fechaLimite) return -1
    return new Date(a.fechaLimite) - new Date(b.fechaLimite)
  })
}

// ─── Paginación del feed ───────────────────────────────────────────────────────

const MAX_PAGINAS = 5
const OBRAS_OBJETIVO = 300
const PAUSA_ENTRE_PAGINAS_MS = 800

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

    let entries = extraerEntradas(result)
    const pagina = entries
      .filter(filtroFn)
      .map(extraerDatos)
      .filter(Boolean)
    resultados = resultados.concat(pagina)
    entries = null // liberar memoria
    paginas++

    if (resultados.length >= maxResultados) break

    url = encontrarSiguienteURL(result)
    if (url) await new Promise(r => setTimeout(r, PAUSA_ENTRE_PAGINAS_MS))
  }

  return resultados
}

async function descargarTodasLicitaciones() {
  return descargarYFiltrar(entry => esObra(entry) && estaEnPlazo(entry), OBRAS_OBJETIVO)
}

// ─── Descarga principal ────────────────────────────────────────────────────────

async function descargarYProcesar() {
  try {
    console.log('[placsp] Descargando ATOM...')
    const todasObras = await descargarTodasLicitaciones()

    const ahora = new Date()
    cache.datos = ordenar(todasObras)
    cache.ultimaActualizacion = ahora.toISOString()
    cache.proximaActualizacion = getProximaActualizacion().toISOString()
    console.log(`[placsp] OK — ${todasObras.length} obras en plazo`)
  } catch (err) {
    logger.error('placsp', 'Error en descarga: ' + err.message)
  }
}

// ─── Tareas programadas ────────────────────────────────────────────────────────

cron.schedule('0 7 * * 1-5', () => {
  console.log('[CRON 07:00] Descargando licitaciones...')
  descargarYProcesar()
}, { timezone: 'Europe/Madrid' })

cron.schedule('0 12 * * 1-5', () => {
  console.log('[CRON 12:00] Actualizando licitaciones...')
  descargarYProcesar()
}, { timezone: 'Europe/Madrid' })

cron.schedule('0 18 * * 1-5', () => {
  console.log('[CRON 18:00] Actualizando licitaciones...')
  descargarYProcesar()
}, { timezone: 'Europe/Madrid' })

cron.schedule('0 7 * * 6', () => {
  console.log('[CRON SAB 07:00] Actualizando licitaciones...')
  descargarYProcesar()
}, { timezone: 'Europe/Madrid' })

cron.schedule('0 * * * *', () => {
  if (!cache.datos) return

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const antes = cache.datos.length

  cache.datos = cache.datos.filter(l => {
    if (!l.fechaLimite) return true
    return new Date(l.fechaLimite + 'T00:00:00') >= hoy
  })

  const eliminadas = antes - cache.datos.length
  if (eliminadas > 0) {
    console.log(`[cache] Limpieza horaria: ${eliminadas} licitaciones expiradas eliminadas. Quedan ${cache.datos.length}.`)
  }
}, { timezone: 'Europe/Madrid' })

// ─── Endpoints ─────────────────────────────────────────────────────────────────

app.get('/api/licitaciones', async (req, res) => {
  try {
    const forzar = req.query.refresh === '1'

    if (forzar || !cache.datos) {
      await descargarYProcesar()
    } else {
      console.log('[cache] Sirviendo desde caché')
    }

    if (!cache.datos) {
      return res.json({ error: 'No hay datos disponibles todavía', licitaciones: [] })
    }

    res.json({
      total: cache.datos.length,
      actualizacion: cache.ultimaActualizacion,
      proximaActualizacion: cache.proximaActualizacion,
      licitaciones: cache.datos
    })
  } catch (err) {
    logger.error('api', 'Error: ' + err.message)
    res.json({ error: err.message || 'Error al obtener licitaciones', licitaciones: [] })
  }
})

app.get('/api/buscar-cpv', async (req, res) => {
  try {
    const codigo = (req.query.codigo || '').trim()
    if (!codigo) {
      return res.json({ error: 'Debes indicar un código CPV', licitaciones: [] })
    }

    const resultados = await descargarYFiltrar(
      entry => estaEnPlazo(entry) && cpvCoincide(entry, codigo),
      50
    )

    res.json({
      total: resultados.length,
      licitaciones: resultados.slice(0, 50),
    })
  } catch (err) {
    logger.error('api', 'Error en buscar-cpv: ' + err.message)
    res.json({ error: err.message || 'Error al buscar por CPV', licitaciones: [] })
  }
})

app.post('/api/resumen-ia', async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'El servicio de resumen con IA no está configurado' })
    }

    const { titulo, organismo, importe, fechaLimite, cpv, enlace } = req.body || {}

    const prompt = `Eres un asistente que ayuda a pequeñas constructoras a entender licitaciones públicas de forma rápida y sin tecnicismos.

Te paso los datos de una licitación pública española. Genera un resumen breve y claro, en español, dirigido a una constructora que está valorando si presentarse o no.

Datos de la licitación:
- Título: ${titulo || 'No disponible'}
- Organismo: ${organismo || 'No disponible'}
- Importe: ${importe ? `${importe} €` : 'No disponible'}
- Fecha límite de presentación: ${fechaLimite || 'No disponible'}
- Código CPV: ${cpv || 'No disponible'}
- Enlace al perfil del contratante: ${enlace || 'No disponible'}

Estructura el resumen exactamente con estos apartados, usando un lenguaje sencillo y directo (evita jerga jurídica o administrativa):

1. Tipo de obra y descripción
2. Requisitos principales
3. Documentación necesaria
4. Plazo de ejecución (si aparece)
5. Observaciones relevantes

Termina siempre con una línea que empiece por "Recomendación:" indicando si merece la pena estudiarla.

Si no tienes información suficiente para algún apartado, indícalo brevemente sin inventar datos.`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    res.json({ resumen: message.content[0].text })
  } catch (err) {
    logger.error('api', 'Error en resumen-ia: ' + err.message)
    res.status(500).json({ error: 'No se ha podido generar el resumen con IA' })
  }
})

app.get('/api/estado', (req, res) => {
  res.json({
    estado: 'ok',
    ultimaActualizacion: cache.ultimaActualizacion,
    proximaActualizacion: cache.proximaActualizacion,
    totalLicitaciones: cache.datos ? cache.datos.length : 0,
    servidor: new Date().toISOString()
  })
})

// ─── Servir frontend React (build de producción) ──────────────────────────────
// Ejecutar: cd client && npm run build — y luego node server.js sirve todo en :3000

const clientDist = path.join(__dirname, '..', 'client', 'dist')
const fs = require('fs')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// ─── Arranque ──────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nLiciTracker corriendo en http://localhost:${PORT}`)

  const interfaces = os.networkInterfaces()
  for (const ifaces of Object.values(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Accesible en red local: http://${iface.address}:${PORT}`)
      }
    }
  }

  console.log('\nHorarios de actualización: 07:00, 12:00 y 18:00 (L-V)')
  console.log('Descargando datos iniciales...')
  descargarYProcesar()
})
