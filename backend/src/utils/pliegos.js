const https = require('https')
const http = require('http')
const cheerio = require('cheerio')

const BASE_URL = 'https://contrataciondelestado.es/'
const TOPE_BYTES = 20 * 1024 * 1024
const TIMEOUT_MS = 20000
const REDIRECTS_MAX = 5

function resolverUrl(href, base) {
  try { return new URL(href, base).toString() } catch { return null }
}

function get(url, redirects = REDIRECTS_MAX) {
  return new Promise(resolve => {
    if (!url) { resolve(null); return }
    const mod = url.startsWith('http://') ? http : https
    const req = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        res.resume()
        resolve(get(resolverUrl(res.headers.location, url), redirects - 1))
        return
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }))
    })
    req.on('error', () => resolve(null))
    req.setTimeout(TIMEOUT_MS, () => req.destroy())
  })
}

// Descarga con tope de bytes: si la respuesta supera maxBytes, se descarta entera
// (truncado: true) en vez de devolver un buffer cortado a mitad.
function getCapped(url, maxBytes, redirects = REDIRECTS_MAX) {
  return new Promise(resolve => {
    if (!url) { resolve(null); return }
    const mod = url.startsWith('http://') ? http : https
    const req = mod.request(url, { method: 'GET', headers: { 'User-Agent': 'Mozilla/5.0', Connection: 'close' } }, res => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        res.resume()
        resolve(getCapped(resolverUrl(res.headers.location, url), maxBytes, redirects - 1))
        return
      }
      const chunks = []
      let total = 0
      let truncado = false
      res.on('data', c => {
        total += c.length
        if (total > maxBytes) { truncado = true; req.destroy(); return }
        chunks.push(c)
      })
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), bytes: total, truncado }))
      res.on('close', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), bytes: total, truncado }))
    })
    req.on('error', () => resolve({ status: 'ERROR', headers: {}, bytes: 0, truncado: true }))
    req.setTimeout(TIMEOUT_MS, () => { req.destroy(); resolve({ status: 'TIMEOUT', headers: {}, bytes: 0, truncado: true }) })
    req.end()
  })
}

function nombreDesdeContentDisposition(headers) {
  const cd = (headers && headers['content-disposition']) || ''
  const match = cd.match(/filename=([^;]+)/)
  return match ? match[1].replace(/"/g, '').trim() : 'documento.pdf'
}

// Filas de la tabla de documentos de la ficha cuyo tipo coincide con /pliego/i
// (cubre "Pliego" y "Rectificación de Pliego") y que tienen al menos un enlace
// de envoltorio funcionando (no roto con "#") — esa es la fila vigente.
function filasPliegoVigentes(html, baseUrl) {
  const $ = cheerio.load(html)
  const filas = []
  $('table tr').each((i, tr) => {
    const tipoCell = $(tr).find('.tipoDocumento')
    if (tipoCell.length === 0) return
    const tipo = tipoCell.text().trim()
    const enlaces = []
    $(tr).find('a[href]').each((j, a) => {
      const href = $(a).attr('href')
      if (!href) return
      const abs = resolverUrl(href, baseUrl)
      if (abs) enlaces.push(abs)
    })
    filas.push({ tipo, enlaces })
  })

  const candidatas = filas.filter(f => /pliego/i.test(f.tipo))
  return candidatas.filter(f => f.enlaces.length > 0 && f.enlaces.some(h => !h.endsWith('#')))
}

// Todos los <a href> del envoltorio "Documento de Pliegos", sin filtrar por
// patrón de URL (hay al menos 2 endpoints distintos que sirven documentos
// reales en PLACSP) — se clasifican luego solo por Content-Type.
function enlacesDelEnvoltorio(html, baseUrl) {
  const $ = cheerio.load(html)
  const enlaces = new Set()
  $('a[href]').each((i, a) => {
    const href = $(a).attr('href')
    if (!href) return
    const abs = resolverUrl(href, baseUrl)
    if (abs) enlaces.add(abs)
  })
  return [...enlaces]
}

async function obtenerPliegosPDF(enlace) {
  const pdfs = []
  let acumulado = 0

  if (!enlace || enlace === '#') return pdfs

  const fichaRes = await get(enlace)
  if (!fichaRes || fichaRes.status !== 200) return pdfs

  const vigentes = filasPliegoVigentes(fichaRes.body.toString('utf8'), BASE_URL)
  if (vigentes.length === 0) return pdfs

  for (const fila of vigentes) {
    const wrapperHref = fila.enlaces[0]
    if (!wrapperHref) continue

    const wrapperRes = await get(wrapperHref)
    if (!wrapperRes || wrapperRes.status !== 200) continue

    const ct = wrapperRes.headers['content-type'] || ''
    if (!ct.includes('html')) continue

    const nestedLinks = enlacesDelEnvoltorio(wrapperRes.body.toString('utf8'), BASE_URL)

    for (const link of nestedLinks) {
      if (acumulado >= TOPE_BYTES) break

      const restante = TOPE_BYTES - acumulado
      const docRes = await getCapped(link, restante)
      if (!docRes || docRes.status !== 200 || docRes.truncado) continue

      const docCt = docRes.headers['content-type'] || ''
      if (!docCt.includes('application/pdf')) continue

      pdfs.push({
        filename: nombreDesdeContentDisposition(docRes.headers),
        base64: docRes.body.toString('base64'),
        bytes: docRes.bytes,
      })
      acumulado += docRes.bytes
    }
  }

  return pdfs
}

module.exports = { obtenerPliegosPDF }
