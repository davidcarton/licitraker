# Resumen IA con lectura de pliegos + botones en tarjeta — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que el botón "Resumen IA" de cada tarjeta de licitación (siempre 1 licitación a la vez) lea los pliegos reales de PLACSP y genere un resumen con características técnicas y documentación a presentar, en vez de un resumen basado solo en metadatos; y que los 3 botones de la tarjeta ("Ver licitación oficial", "Resumen IA", "Guardar") vivan dentro de `LicitacionCard.jsx`.

**Architecture:** Nuevo módulo `backend/src/utils/pliegos.js` hace scraping de 2 saltos contra PLACSP (ficha → envoltorio "Pliego" vigente → documentos reales filtrados por `Content-Type`) y devuelve PDFs en base64. El endpoint `POST /api/resumen-ia` cachea por `expediente` en una tabla nueva, llama a `claude-sonnet-4-6` con esos PDFs adjuntos, reintenta sin el PDF más grande si Claude rechaza la petición, y como último recurso resume por bloques (map-reduce) un PDF que siga sin entrar. En frontend, los botones se mueven de `Licitaciones.jsx` a `LicitacionCard.jsx` sin cambiar su lógica.

**Tech Stack:** Node.js/Express + knex (PostgreSQL) en backend, React en frontend. Nuevas dependencias de backend: `cheerio` (parseo HTML) y `pdf-lib` (dividir un PDF en bloques de páginas para el fallback map-reduce).

## Global Constraints

- El flujo de "Resumen IA" es **siempre por licitación individual** — nunca procesa varias licitaciones a la vez, aunque la app tenga cientos cargadas.
- Tope de **20MB combinados en bruto** de PDFs por resumen. Si un documento no entra completo en el cupo restante, **se descarta entero, nunca se trunca a mitad** (un PDF cortado queda con estructura inválida).
- Sin límite de cantidad de documentos.
- Modelo de Claude para este endpoint: `claude-sonnet-4-6` (no `claude-haiku-4-5`) — su contexto de 1M eleva el límite de páginas por PDF de 100 a 600.
- Filtrar documentos candidatos del envoltorio de pliegos **solo por la cabecera `Content-Type: application/pdf`** de la respuesta — nunca por patrón de URL (hay al menos 2 endpoints distintos confirmados en PLACSP).
- Si cualquier paso de la descarga de pliegos falla, el resumen se genera igual con fallback a solo metadatos — nunca se devuelve un error al usuario por esto.
- **No hay framework de tests automatizados en este proyecto** (sin jest/mocha/vitest). Toda verificación de este plan es manual: scripts `node -e` puntuales contra licitaciones reales de PLACSP, y comprobación visual en el navegador — igual que indica la sección "Testing" de la spec.
- Toda licitación de ejemplo usada en verificación debe ser una real de PLACSP (`contrataciondelestado.es`), no inventada.

---

### Task 1: Migración de base de datos para el caché de resúmenes

**Files:**
- Create: `backend/src/db/migrations/007_crear_resumenes_ia.js`

**Interfaces:**
- Produces: tabla `resumenes_ia` con columnas `expediente` (string, única), `resumen` (text), `pliegos_encontrados` (integer), `created_at`/`updated_at`. Las tareas siguientes hacen `db('resumenes_ia').where({ expediente }).first()` y `db('resumenes_ia').insert({ expediente, resumen, pliegos_encontrados }).onConflict('expediente').merge()`.

- [ ] **Step 1: Crear el archivo de migración**

```js
// backend/src/db/migrations/007_crear_resumenes_ia.js
exports.up = knex => knex.schema.createTable('resumenes_ia', t => {
  t.increments('id').primary()
  t.string('expediente', 200).notNullable().unique()
  t.text('resumen').notNullable()
  t.integer('pliegos_encontrados').defaultTo(0)
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('resumenes_ia')
```

- [ ] **Step 2: Ejecutar la migración**

Run: `cd backend && npm run migrate`
Expected: en la salida aparece `Batch X run: 1 migrations` y la última línea menciona `007_crear_resumenes_ia.js`.

- [ ] **Step 3: Verificar la tabla manualmente**

Run: `cd backend && node -e "require('./src/db')('resumenes_ia').then(r => { console.log('OK, filas:', r.length); process.exit(0) }).catch(e => { console.error(e.message); process.exit(1) })"`
Expected: `OK, filas: 0`

- [ ] **Step 4: Commit**

```bash
git add backend/src/db/migrations/007_crear_resumenes_ia.js
git commit -m "feat: añadir tabla resumenes_ia para cachear resúmenes IA por expediente"
```

---

### Task 2: Módulo de scraping de pliegos PLACSP

**Files:**
- Create: `backend/src/utils/pliegos.js`

**Interfaces:**
- Consumes: nada de tareas anteriores (módulo independiente).
- Produces: `obtenerPliegosPDF(enlace: string): Promise<Array<{ filename: string, base64: string, bytes: number }>>` — exportada como `module.exports = { obtenerPliegosPDF }`. La Tarea 3 importa esta función.

- [ ] **Step 1: Instalar la dependencia `cheerio`**

Run: `cd backend && npm install cheerio`
Expected: `package.json` gana una línea `"cheerio": "^X.Y.Z"` en `dependencies` y la instalación termina sin errores (`added N packages`).

- [ ] **Step 2: Escribir el script de verificación contra una licitación real**

Antes de implementar nada, comprobamos que el comportamiento actual (módulo inexistente) falla como se espera:

Run:
```bash
cd backend && node -e "
const { obtenerPliegosPDF } = require('./src/utils/pliegos')
obtenerPliegosPDF('https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=nmXaZZWsA0L')
  .then(pdfs => { console.log('PDFs encontrados:', pdfs.length); pdfs.forEach(p => console.log(' -', p.filename, p.bytes, 'bytes')) })
  .catch(e => console.error('ERROR:', e.message))
"
```
Expected: FAIL — `Cannot find module './src/utils/pliegos'` (el módulo todavía no existe).

> Nota: el enlace usado (`idEvl=nmXaZZWsA0L`, expediente `E2024022197`) es una licitación real de obra de PLACSP, ya validada en pruebas previas contra esta plataforma (Sistema Dinámico de Adquisición de obras) — tiene 3 PDFs reales detrás de su envoltorio "Pliego". Si en el momento de ejecutar este paso la licitación ya no estuviera disponible en PLACSP, sustituir por cualquier licitación de obra en plazo tomada de `https://contrataciondelestado.es/`.

- [ ] **Step 3: Implementar el módulo**

```js
// backend/src/utils/pliegos.js
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
```

- [ ] **Step 4: Volver a ejecutar la verificación**

Run: (mismo comando del Step 2)
Expected: PASS — `PDFs encontrados: 3` (o similar, ≥1) y una lista de nombres de archivo tipo `DOC...SDA_obras...pdf` con tamaños en bytes razonables (no 0).

- [ ] **Step 5: Verificar el caso "sin pliego" (fallback a array vacío)**

Run:
```bash
cd backend && node -e "
const { obtenerPliegosPDF } = require('./src/utils/pliegos')
obtenerPliegosPDF('https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=ESTONOEXISTE')
  .then(pdfs => console.log('PDFs encontrados:', pdfs.length))
  .catch(e => console.error('ERROR (no debería lanzar):', e.message))
"
```
Expected: PASS — `PDFs encontrados: 0`, sin que se imprima ningún `ERROR` (la función nunca lanza, siempre devuelve array, vacío incluido).

- [ ] **Step 6: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/src/utils/pliegos.js
git commit -m "feat: scraping de pliegos PDF reales de PLACSP (flujo de 2 saltos)"
```

---

### Task 3: Endpoint resumen-ia — caché por expediente y modelo Sonnet 4.6

**Files:**
- Modify: `backend/server.js:411-455` (endpoint `POST /api/resumen-ia`)

**Interfaces:**
- Consumes: `obtenerPliegosPDF(enlace)` de la Tarea 2; tabla `resumenes_ia` de la Tarea 1; `db` desde `./src/db` (mismo patrón que `backend/src/routes/licitaciones.js`).
- Produces: el endpoint sigue devolviendo `{ resumen: string }` en el body de la respuesta — el contrato con el frontend no cambia. Internamente expone `construirPromptResumen({ titulo, organismo, importe, fechaLimite, cpv, enlace, hayPliegos })` y `bloqueDocumento(pdf)`, usadas también por la Tarea 4.

- [ ] **Step 1: Comprobar el comportamiento actual antes de tocar nada**

Run: `cd backend && node server.js &` (esperar a que aparezca `LiciTracker corriendo en http://localhost:3000`), luego en otra terminal:
```bash
curl -s -X POST http://localhost:3000/api/resumen-ia \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Obra de prueba","organismo":"Ayto","importe":50000,"fechaLimite":"2026-12-31","cpv":"45000000","enlace":"https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=nmXaZZWsA0L"}'
```
Expected: responde con `{"resumen": "..."}` generado solo con metadatos (no menciona características técnicas concretas, porque el endpoint actual nunca descarga pliegos). Parar el servidor (`kill %1` o Ctrl+C) tras comprobarlo.

- [ ] **Step 2: Añadir el require de `pliegos.js` y de `db`, y la función de prompt**

Insertar tras la línea `const Anthropic = require('@anthropic-ai/sdk')` (línea 11 de `backend/server.js`):

```js
const { obtenerPliegosPDF } = require('./src/utils/pliegos')
const db = require('./src/db')
```

Insertar justo antes de `app.post('/api/resumen-ia', ...)` (sustituye al bloque del prompt fijo que hoy vive dentro del endpoint):

```js
const MODELO_RESUMEN = 'claude-sonnet-4-6'

function construirPromptResumen({ titulo, organismo, importe, fechaLimite, cpv, enlace, hayPliegos }) {
  const sinDatos = ' — indica explícitamente que no se han podido leer los pliegos y que esta información no está disponible'

  return `Eres un asistente que ayuda a pequeñas constructoras a entender licitaciones públicas de forma rápida y sin tecnicismos.

Te paso los datos de una licitación pública española${hayPliegos ? ', junto con los documentos reales del pliego (pliego de prescripciones técnicas y/o cláusulas administrativas)' : ''}. Genera un resumen claro, en español, dirigido a una constructora que está valorando si presentarse o no.

Datos de la licitación:
- Título: ${titulo || 'No disponible'}
- Organismo: ${organismo || 'No disponible'}
- Importe: ${importe ? `${importe} €` : 'No disponible'}
- Fecha límite de presentación: ${fechaLimite || 'No disponible'}
- Código CPV: ${cpv || 'No disponible'}
- Enlace al perfil del contratante: ${enlace || 'No disponible'}

Estructura el resumen exactamente con estos apartados, usando un lenguaje sencillo y directo (evita jerga jurídica o administrativa):

1. Tipo de obra y descripción
2. Características técnicas clave (medidas, volúmenes, materiales, plazos de ejecución)${hayPliegos ? '' : sinDatos}
3. Documentación a presentar${hayPliegos ? '' : sinDatos}
4. Requisitos principales (solvencia, clasificación...)
5. Observaciones relevantes

Termina siempre con una línea que empiece por "Recomendación:" indicando si merece la pena estudiarla.

${hayPliegos
    ? 'Usa las características técnicas y la documentación a presentar tal y como aparecen en los pliegos adjuntos — no inventes datos que no estén en los documentos.'
    : 'No se han podido leer los pliegos de esta licitación: basa el resumen solo en los metadatos anteriores y deja explícito en los apartados 2 y 3 que esa información no está disponible, sin inventar características técnicas.'}`
}

function bloqueDocumento(pdf) {
  return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf.base64 } }
}

async function llamarClaude(anthropic, prompt, pdfs) {
  const content = pdfs.length
    ? [...pdfs.map(bloqueDocumento), { type: 'text', text: prompt }]
    : prompt

  const message = await anthropic.messages.create({
    model: MODELO_RESUMEN,
    max_tokens: 1536,
    messages: [{ role: 'user', content }],
  })
  return message.content[0].text
}
```

- [ ] **Step 3: Reescribir el endpoint para usar caché + pliegos + nuevo modelo**

Sustituir el cuerpo de `app.post('/api/resumen-ia', ...)` (líneas 411-455) por:

```js
app.post('/api/resumen-ia', async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'El servicio de resumen con IA no está configurado' })
    }

    const { titulo, organismo, importe, fechaLimite, cpv, enlace, expediente } = req.body || {}

    if (expediente) {
      const cacheado = await db('resumenes_ia').where({ expediente }).first()
      if (cacheado) {
        return res.json({ resumen: cacheado.resumen })
      }
    }

    let pdfs = []
    try {
      pdfs = await obtenerPliegosPDF(enlace)
    } catch (e) {
      logger.warn('pliegos', `Error al descargar pliegos: ${e.message}`)
    }

    const prompt = construirPromptResumen({ titulo, organismo, importe, fechaLimite, cpv, enlace, hayPliegos: pdfs.length > 0 })
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const resumen = await llamarClaude(anthropic, prompt, pdfs)

    if (expediente) {
      await db('resumenes_ia')
        .insert({ expediente, resumen, pliegos_encontrados: pdfs.length })
        .onConflict('expediente').merge()
    }

    res.json({ resumen })
  } catch (err) {
    logger.error('api', 'Error en resumen-ia: ' + err.message)
    res.status(500).json({ error: 'No se ha podido generar el resumen con IA' })
  }
})
```

- [ ] **Step 4: Verificar el nuevo comportamiento**

Run: `cd backend && node server.js &` (esperar arranque), luego:
```bash
curl -s -X POST http://localhost:3000/api/resumen-ia \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Obra de prueba","organismo":"Ayto","importe":50000,"fechaLimite":"2026-12-31","cpv":"45000000","enlace":"https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=nmXaZZWsA0L","expediente":"TEST-PLAN-001"}'
```
Expected: PASS — responde `{"resumen": "..."}` y el apartado 2 ("Características técnicas clave") ya menciona detalles concretos extraídos del pliego real (no la frase de "no disponible"). Parar el servidor.

- [ ] **Step 5: Verificar que la segunda llamada usa caché (no vuelve a llamar a Claude/PLACSP)**

Run: `cd backend && node server.js &` (esperar arranque), luego repetir la misma petición curl del Step 4 con el mismo `expediente` dos veces seguidas y comparar tiempos:
```bash
time curl -s -X POST http://localhost:3000/api/resumen-ia \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Obra de prueba","enlace":"https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=nmXaZZWsA0L","expediente":"TEST-PLAN-001"}' -o /dev/null
```
Expected: PASS — la segunda ejecución responde en milisegundos (caché en `resumenes_ia`), muy por debajo del tiempo de la primera (que descarga pliegos y llama a Claude). Parar el servidor y limpiar la fila de prueba: `node -e "require('./src/db')('resumenes_ia').where({expediente:'TEST-PLAN-001'}).del().then(() => process.exit(0))"`.

- [ ] **Step 6: Commit**

```bash
git add backend/server.js
git commit -m "feat: resumen-ia lee pliegos reales, cachea por expediente y usa claude-sonnet-4-6"
```

---

### Task 4: Reintento sin el PDF más grande cuando Claude rechaza la petición

**Files:**
- Modify: `backend/server.js` (función `llamarClaude` y el endpoint `POST /api/resumen-ia`, añadidos en la Tarea 3)

**Interfaces:**
- Consumes: `llamarClaude(anthropic, prompt, pdfs)` de la Tarea 3.
- Produces: `generarResumenConDocumentos(anthropic, prompt, pdfs): Promise<string>` — sustituye la llamada directa a `llamarClaude` en el endpoint. Usada también por la Tarea 5 (que añade el fallback de bloques dentro de esta función).

- [ ] **Step 1: Verificar el comportamiento actual (sin reintento) con una petición que simula rechazo**

No es posible forzar un 400 real de Claude sin un documento que exceda el límite a mano, así que la verificación de este paso es de lectura de código: confirmar que, antes de este cambio, `llamarClaude` no captura ningún error y un 400 de Claude se propagaría directo al `catch` genérico del endpoint (mensaje `'No se ha podido generar el resumen con IA'`, sin intentar nada con menos documentos). Confirmarlo leyendo `backend/server.js` tal y como queda tras la Tarea 3.
Expected: el endpoint actual no tiene ninguna lógica de reintento — un 400 de Claude por cualquier PDF se traduce siempre en el mensaje de error genérico, perdiendo el resumen.

- [ ] **Step 2: Añadir la función `generarResumenConDocumentos` con reintento**

Insertar justo después de la función `llamarClaude` (añadida en la Tarea 3):

```js
function ordenarPorTamanoDesc(pdfs) {
  return [...pdfs].sort((a, b) => b.bytes - a.bytes)
}

async function generarResumenConDocumentos(anthropic, prompt, pdfs) {
  if (pdfs.length === 0) {
    return llamarClaude(anthropic, prompt, [])
  }

  try {
    return await llamarClaude(anthropic, prompt, pdfs)
  } catch (err) {
    if (err.status !== 400 || pdfs.length === 1) {
      return llamarClaude(anthropic, prompt, [])
    }

    const sinElMasGrande = ordenarPorTamanoDesc(pdfs).slice(1)
    try {
      return await llamarClaude(anthropic, prompt, sinElMasGrande)
    } catch {
      return llamarClaude(anthropic, prompt, [])
    }
  }
}
```

- [ ] **Step 3: Usar la nueva función en el endpoint**

En `backend/server.js`, dentro de `app.post('/api/resumen-ia', ...)`, sustituir:

```js
    const resumen = await llamarClaude(anthropic, prompt, pdfs)
```

por:

```js
    const resumen = await generarResumenConDocumentos(anthropic, prompt, pdfs)
```

- [ ] **Step 4: Verificar que el caso normal (sin rechazo) sigue funcionando**

Run: `cd backend && node server.js &` (esperar arranque), luego repetir la petición curl del Task 3 Step 4 con un `expediente` distinto (p. ej. `TEST-PLAN-002`):
```bash
curl -s -X POST http://localhost:3000/api/resumen-ia \
  -H "Content-Type: application/json" \
  -d '{"titulo":"Obra de prueba","enlace":"https://contrataciondelestado.es/wps/poc?uri=deeplink:detalle_licitacion&idEvl=nmXaZZWsA0L","expediente":"TEST-PLAN-002"}'
```
Expected: PASS — responde igual que antes (`{"resumen": "..."}` con características técnicas), porque `generarResumenConDocumentos` no cambia el comportamiento cuando Claude acepta la petición a la primera. Parar el servidor y limpiar: `node -e "require('./src/db')('resumenes_ia').where({expediente:'TEST-PLAN-002'}).del().then(() => process.exit(0))"`.

- [ ] **Step 5: Commit**

```bash
git add backend/server.js
git commit -m "feat: reintentar resumen-ia sin el PDF mas grande si Claude rechaza la peticion"
```

---

### Task 5: Fallback de resumen por bloques (map-reduce) para un PDF que sigue sin entrar

**Files:**
- Modify: `backend/server.js` (función `generarResumenConDocumentos` de la Tarea 4)

**Interfaces:**
- Consumes: `MODELO_RESUMEN`, `ordenarPorTamanoDesc(pdfs)` de tareas anteriores.
- Produces: `dividirPDFEnBloques(base64: string): Promise<string[]>` y `resumenPorBloques(anthropic, promptOriginal, pdf): Promise<string>` — usadas dentro de `generarResumenConDocumentos`, no expuestas fuera de `server.js`.

- [ ] **Step 1: Instalar la dependencia `pdf-lib`**

Run: `cd backend && npm install pdf-lib`
Expected: `package.json` gana `"pdf-lib": "^X.Y.Z"` en `dependencies`, instalación sin errores.

- [ ] **Step 2: Confirmar que `dividirPDFEnBloques` no existe todavía**

`server.js` arranca el servidor completo (BD, cron) en cuanto se ejecuta o se `require`a — no se puede importar de forma aislada para probarlo sin levantar todo el proceso. Por eso esta comprobación "antes" es de lectura, no de ejecución:

Run: `grep -n "dividirPDFEnBloques" backend/server.js`
Expected: FAIL — sin resultados (la función todavía no existe en el archivo).

- [ ] **Step 3: Implementar `dividirPDFEnBloques` y `resumenPorBloques`**

Añadir al principio de `backend/server.js`, junto a los demás `require`:

```js
const { PDFDocument } = require('pdf-lib')
```

Insertar tras `ordenarPorTamanoDesc` (añadida en la Tarea 4):

```js
const PAGINAS_POR_BLOQUE = 80

async function dividirPDFEnBloques(base64, paginasPorBloque = PAGINAS_POR_BLOQUE) {
  const buffer = Buffer.from(base64, 'base64')
  const original = await PDFDocument.load(buffer)
  const totalPaginas = original.getPageCount()
  const bloques = []

  for (let inicio = 0; inicio < totalPaginas; inicio += paginasPorBloque) {
    const fin = Math.min(inicio + paginasPorBloque, totalPaginas)
    const nuevo = await PDFDocument.create()
    const indices = []
    for (let p = inicio; p < fin; p++) indices.push(p)
    const paginasCopiadas = await nuevo.copyPages(original, indices)
    paginasCopiadas.forEach(p => nuevo.addPage(p))
    const bytes = await nuevo.save()
    bloques.push(Buffer.from(bytes).toString('base64'))
  }

  return bloques
}

async function resumenPorBloques(anthropic, promptOriginal, pdf) {
  const bloques = await dividirPDFEnBloques(pdf.base64)
  const resumenesParciales = []

  for (let i = 0; i < bloques.length; i++) {
    const promptBloque = `Este es el bloque ${i + 1} de ${bloques.length} de un documento de pliego de una licitación pública. Resume en español, de forma breve, las características técnicas (medidas, volúmenes, materiales) y la documentación a presentar que aparezcan en este bloque concreto. No repitas información genérica, céntrate solo en lo que aparece en estas páginas.`

    const message = await anthropic.messages.create({
      model: MODELO_RESUMEN,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: bloques[i] } },
          { type: 'text', text: promptBloque },
        ],
      }],
    })
    resumenesParciales.push(message.content[0].text)
  }

  const promptFinal = `${promptOriginal}

El pliego de esta licitación es muy extenso y se ha resumido por bloques. Aquí tienes los resúmenes de cada bloque, en orden:

${resumenesParciales.map((r, i) => `--- Bloque ${i + 1} ---\n${r}`).join('\n\n')}

Sintetiza toda esta información en el resumen final de la licitación, siguiendo la estructura de apartados pedida, sin perder ninguna característica técnica ni documento a presentar que se mencione en los bloques.`

  const final = await anthropic.messages.create({
    model: MODELO_RESUMEN,
    max_tokens: 1536,
    messages: [{ role: 'user', content: promptFinal }],
  })
  return final.content[0].text
}
```

- [ ] **Step 4: Conectar el fallback dentro de `generarResumenConDocumentos`**

Sustituir la función `generarResumenConDocumentos` (de la Tarea 4) por esta versión, que añade el intento de bloques cuando el reintento sin el PDF más grande también falla:

```js
async function generarResumenConDocumentos(anthropic, prompt, pdfs) {
  if (pdfs.length === 0) {
    return llamarClaude(anthropic, prompt, [])
  }

  try {
    return await llamarClaude(anthropic, prompt, pdfs)
  } catch (err) {
    if (err.status !== 400) {
      return llamarClaude(anthropic, prompt, [])
    }

    const ordenados = ordenarPorTamanoDesc(pdfs)
    const masGrande = ordenados[0]
    const sinElMasGrande = ordenados.slice(1)

    if (sinElMasGrande.length > 0) {
      try {
        return await llamarClaude(anthropic, prompt, sinElMasGrande)
      } catch (err2) {
        if (err2.status !== 400) return llamarClaude(anthropic, prompt, [])
      }
    }

    try {
      return await resumenPorBloques(anthropic, prompt, masGrande)
    } catch {
      return llamarClaude(anthropic, prompt, [])
    }
  }
}
```

- [ ] **Step 5: Verificar `dividirPDFEnBloques` de forma aislada (sin llamar a Claude)**

Run:
```bash
cd backend && node -e "
;(async () => {
  const { PDFDocument } = require('pdf-lib')
  const doc = await PDFDocument.create()
  for (let i = 0; i < 170; i++) doc.addPage([200, 200])
  const bytes = await doc.save()
  const base64 = Buffer.from(bytes).toString('base64')

  // dividirPDFEnBloques no se exporta (es interna de server.js); reimplementamos
  // la misma lógica aquí solo para verificar el cálculo de bloques de forma aislada.
  const original = await PDFDocument.load(Buffer.from(base64, 'base64'))
  const total = original.getPageCount()
  const PAGINAS_POR_BLOQUE = 80
  const numBloques = Math.ceil(total / PAGINAS_POR_BLOQUE)
  console.log('Páginas totales:', total, '| Bloques esperados:', numBloques)
})()
"
```
Expected: PASS — `Páginas totales: 170 | Bloques esperados: 3` (170 / 80 = 2.125 → 3 bloques de 80/80/10 páginas).

- [ ] **Step 6: Verificar que el flujo normal (sin rechazo de Claude) no se ve afectado**

Run: `cd backend && node server.js &` (esperar arranque), repetir la petición del Task 4 Step 4 con `expediente` `TEST-PLAN-003`.
Expected: PASS — responde igual que antes, sin pasar nunca por `resumenPorBloques` (solo se activa si Claude rechaza dos veces seguidas). Parar el servidor y limpiar: `node -e "require('./src/db')('resumenes_ia').where({expediente:'TEST-PLAN-003'}).del().then(() => process.exit(0))"`.

- [ ] **Step 7: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/server.js
git commit -m "feat: fallback de resumen por bloques (map-reduce) para PDFs que Claude sigue rechazando"
```

---

### Task 6: Frontend — enviar `expediente` en la petición de resumen

**Files:**
- Modify: `client/src/pages/ResumenIA.jsx:48-59`

**Interfaces:**
- Consumes: nada nuevo — `licitacion.expediente` ya existe en el objeto `licitacion` que llega por `location.state`.
- Produces: el body de `POST /api/resumen-ia` incluye ahora `expediente`, requerido por la Tarea 3 para cachear.

- [ ] **Step 1: Verificar que hoy no se envía `expediente`**

Run: `grep -n "expediente" client/src/pages/ResumenIA.jsx`
Expected: FAIL (vacío, o solo aparece en el JSX de la sección de datos, nunca dentro del `body: JSON.stringify({...})` del `fetch`) — confirma que falta antes del cambio.

- [ ] **Step 2: Añadir `expediente` al body del fetch**

En `client/src/pages/ResumenIA.jsx`, dentro del `useEffect` (líneas 48-59), cambiar:

```js
    fetch('/api/resumen-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: licitacion.titulo,
        organismo: licitacion.organismo,
        importe: licitacion.importe,
        fechaLimite: licitacion.fechaLimite,
        cpv: licitacion.cpv,
        enlace: licitacion.enlace,
      }),
    })
```

por:

```js
    fetch('/api/resumen-ia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: licitacion.titulo,
        organismo: licitacion.organismo,
        importe: licitacion.importe,
        fechaLimite: licitacion.fechaLimite,
        cpv: licitacion.cpv,
        enlace: licitacion.enlace,
        expediente: licitacion.expediente,
      }),
    })
```

- [ ] **Step 3: Verificar el cambio**

Run: `grep -n "expediente: licitacion.expediente" client/src/pages/ResumenIA.jsx`
Expected: PASS — aparece la línea dentro del `fetch`.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/ResumenIA.jsx
git commit -m "fix: enviar expediente al pedir el resumen IA para poder cachearlo"
```

---

### Task 7: Frontend — mover los botones "Resumen IA" y "Guardar" dentro de la tarjeta

**Files:**
- Modify: `client/src/components/cards/LicitacionCard.jsx`
- Modify: `client/src/pages/Licitaciones.jsx:86-133`

**Interfaces:**
- Consumes: nada de tareas backend — cambio puramente de UI.
- Produces: `LicitacionCard` acepta ahora `onResumenIA(licitacion)`, `onToggleGuardar(licitacion)` y `guardada: boolean` como props nuevas, además de las existentes `licitacion` y `onClick`.

- [ ] **Step 1: Comprobar el aspecto actual en el navegador (antes del cambio)**

Run: `cd client && npm run dev` (en una terminal, dejarlo corriendo) y `cd backend && node server.js` (en otra).
Abrir `http://localhost:5173/dashboard/licitaciones` (o el puerto que indique Vite) en el navegador.
Expected: cada tarjeta muestra "Ver licitación oficial" dentro de la tarjeta, y "Resumen IA"/"Guardar" en una fila aparte, **debajo** de la tarjeta (fuera de su borde/sombra).

- [ ] **Step 2: Añadir las nuevas props y el bloque de botones en `LicitacionCard.jsx`**

En `client/src/components/cards/LicitacionCard.jsx`, cambiar el import de iconos (línea 1-10):

```js
import {
  Building2,
  MapPin,
  Calendar,
  Tag,
  FileText,
  ExternalLink,
  Clock,
} from "lucide-react";
```

por:

```js
import {
  Building2,
  MapPin,
  Calendar,
  Tag,
  FileText,
  ExternalLink,
  Clock,
  Sparkles,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
```

Cambiar la firma del componente (línea 72):

```js
export default function LicitacionCard({ licitacion: l, onClick }) {
```

por:

```js
export default function LicitacionCard({ licitacion: l, onClick, onResumenIA, onToggleGuardar, guardada }) {
```

Insertar, justo después del bloque "Botón Ver licitación" (después del `</div>` que cierra ese bloque, antes del comentario `{/* Fecha publicación */}` — línea 317-319 del archivo original), la nueva fila de 2 botones:

```jsx
        {/* Fila de Resumen IA / Guardar */}
        {(onResumenIA || onToggleGuardar) && (
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            {onResumenIA && (
              <button
                onClick={(e) => { e.stopPropagation(); onResumenIA(l); }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 12px",
                  borderRadius: "var(--r-md)",
                  background: "#EAF4EE",
                  color: "#2A5938",
                  border: "1px solid #3D7A4F",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-body)",
                }}
              >
                <Sparkles size={13} />
                Resumen IA
              </button>
            )}

            {onToggleGuardar && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleGuardar(l); }}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 12px",
                  borderRadius: "var(--r-md)",
                  background: guardada ? "var(--verde-claro)" : "var(--n100)",
                  color: guardada ? "var(--verde)" : "var(--n500)",
                  border: guardada ? "1px solid var(--g200)" : "1px solid transparent",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-body)",
                }}
              >
                {guardada ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                {guardada ? "Guardada" : "Guardar"}
              </button>
            )}
          </div>
        )}

```

- [ ] **Step 3: Simplificar `TarjetaLicitacion` en `Licitaciones.jsx`**

En `client/src/pages/Licitaciones.jsx`, sustituir el componente `TarjetaLicitacion` (líneas 86-133):

```js
function TarjetaLicitacion({ licitacion: l, index: i, guardada, onSeleccionar, onToggleGuardar, navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.035, 0.5) }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 380 }}
    >
      <LicitacionCard licitacion={l} onClick={() => onSeleccionar(l)} />

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/dashboard/resumen', { state: { licitacion: l } }) }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            background: '#EAF4EE',
            color: '#2A5938',
            border: '1px solid #3D7A4F',
            fontSize: 12, fontWeight: 700,
            fontFamily: 'var(--font-body)',
          }}
        >
          <Sparkles size={13} />
          Resumen IA
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleGuardar(l) }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            background: guardada ? 'var(--verde-claro)' : 'var(--n100)',
            color: guardada ? 'var(--verde)' : 'var(--n500)',
            border: guardada ? '1px solid var(--g200)' : '1px solid transparent',
            fontSize: 12, fontWeight: 700,
            fontFamily: 'var(--font-body)',
          }}
        >
          {guardada ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
          {guardada ? 'Guardada' : 'Guardar'}
        </button>
      </div>
    </motion.div>
  )
}
```

por:

```js
function TarjetaLicitacion({ licitacion: l, index: i, guardada, onSeleccionar, onToggleGuardar, navigate }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(i * 0.035, 0.5) }}
      style={{ width: '100%', maxWidth: 380 }}
    >
      <LicitacionCard
        licitacion={l}
        onClick={() => onSeleccionar(l)}
        onResumenIA={(lic) => navigate('/dashboard/resumen', { state: { licitacion: lic } })}
        onToggleGuardar={onToggleGuardar}
        guardada={guardada}
      />
    </motion.div>
  )
}
```

El import de `Sparkles, Bookmark, BookmarkCheck` (línea 4) ya no se usa en este archivo — quitarlos de la lista de imports de `lucide-react`, dejando:

```js
import { SearchX, WifiOff, AlertTriangle, Hash, Search } from 'lucide-react'
```

- [ ] **Step 4: Comprobar visualmente el resultado en el navegador**

Con `npm run dev` (client) y `node server.js` (backend) ya corriendo del Step 1, recargar `http://localhost:5173/dashboard/licitaciones`.
Expected: PASS — cada tarjeta muestra ahora los 3 botones **dentro** de su borde/sombra: "Ver licitación oficial" (ancho completo, arriba) y "Resumen IA"/"Guardar" en una fila debajo, con el mismo aspecto visual que tenían antes (solo cambia que ahora quedan dentro de la tarjeta). Click en "Resumen IA" navega a `/dashboard/resumen` con la licitación correcta. Click en "Guardar" cambia el estado guardado sin abrir el modal de detalle (el `stopPropagation` sigue funcionando).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/cards/LicitacionCard.jsx client/src/pages/Licitaciones.jsx
git commit -m "feat: mover botones Resumen IA y Guardar dentro de la tarjeta de licitacion"
```

---

### Task 8: Verificación manual de extremo a extremo

**Files:** ninguno (solo verificación; no se espera código nuevo)

**Interfaces:** N/A

- [ ] **Step 1: Resumen con pliegos reales, de extremo a extremo**

Con `node server.js` (backend) y `npm run dev` (client) corriendo, abrir `http://localhost:5173/dashboard/licitaciones`, localizar una licitación de obra real con pliego (cualquiera de la lista cargada desde PLACSP) y pulsar "Resumen IA" desde su tarjeta.
Expected: navega a `/dashboard/resumen`, muestra "Generando resumen con IA..." y termina con un resumen cuyo apartado 2 ("Características técnicas clave") menciona datos concretos (medidas, materiales, plazos) y no la frase de "no disponible".

- [ ] **Step 2: Repetir el resumen de la misma licitación (caché)**

Volver atrás y pulsar "Resumen IA" otra vez sobre la misma licitación del Step 1.
Expected: el resumen aparece prácticamente al instante (servido desde `resumenes_ia`, sin esperar a Claude ni a PLACSP).

- [ ] **Step 3: Licitación sin pliego disponible**

Buscar (o forzar editando temporalmente el `enlace` en las DevTools de React) una licitación cuyo `enlace` no tenga ninguna fila "Pliego" en su ficha PLACSP, y pulsar "Resumen IA".
Expected: el resumen se genera igual (fallback a metadatos), y los apartados 2 y 3 dicen explícitamente que esa información no está disponible por no haber podido leer los pliegos — el usuario nunca ve un mensaje de error por esto.

- [ ] **Step 4: Aspecto de la tarjeta y de los 3 botones**

En el listado de `/dashboard/licitaciones`, comprobar visualmente varias tarjetas: los 3 botones quedan dentro de cada tarjeta, con el mismo estilo que tenían antes de este cambio (ver Task 7 Step 1 como referencia del "antes").
Expected: ninguna regresión visual — mismo aspecto, solo cambia la posición de 2 de los 3 botones.

- [ ] **Step 5: Caso de pliego rectificado (varias filas "Pliego"/"Rectificación de Pliego")**

Buscar entre las licitaciones cargadas una cuya ficha PLACSP tenga más de una fila de tipo `/pliego/i` (visible abriendo la ficha oficial en `l.enlace` desde el navegador y mirando la tabla de documentos). Pulsar "Resumen IA" sobre esa licitación.
Expected: el resumen usa el contenido de la versión vigente (la que tiene sus enlaces funcionando), nunca el de una versión anterior con enlace roto — comprobable porque el resumen no falla ni cae al fallback de metadatos pese a haber varias filas.

- [ ] **Step 6: Caso del endpoint `docAccCmpnt` (organismos federados, p. ej. Castilla-La Mancha)**

Buscar una licitación de un organismo de una plataforma autonómica federada (confirmado con casos de Castilla-La Mancha en la validación previa de esta spec) y pulsar "Resumen IA".
Expected: el resumen incluye características técnicas igual que en el caso `GetDocumentByIdServlet` — confirma que `pliegos.js` no depende del patrón de URL del documento, solo del `Content-Type`. Si no se localiza un caso real de este tipo en el momento de la verificación, marcar este paso como pendiente y no bloquear el resto del plan por él.

- [ ] **Step 7: Confirmar con el usuario**

Reportar el resultado de los Steps 1-6 al usuario para que confirme que el comportamiento es el esperado antes de dar por cerrada la implementación.
