const Anthropic = require('@anthropic-ai/sdk')
const { PDFDocument } = require('pdf-lib')

const MODELO_RESUMEN = 'claude-sonnet-4-6'
const MODELO_BLOQUE = 'claude-haiku-4-5-20251001'
const PAGINAS_POR_BLOQUE = 80

// Precios Anthropic en USD por millón de tokens
const PRECIO = {
  sonnet: { input: 3.00, output: 15.00 },
  haiku:  { input: 0.80, output: 4.00 },
}
const USD_A_EUR = 0.92

function calcularCosteEuros({ inputSonnet = 0, outputSonnet = 0, inputHaiku = 0, outputHaiku = 0 }) {
  const usd =
    (inputSonnet * PRECIO.sonnet.input + outputSonnet * PRECIO.sonnet.output) / 1_000_000 +
    (inputHaiku  * PRECIO.haiku.input  + outputHaiku  * PRECIO.haiku.output)  / 1_000_000
  return parseFloat((usd * USD_A_EUR).toFixed(6))
}

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

// Construye el bloque "document" que Anthropic espera para PDFs en base64
function bloqueDocumento(pdf) {
  return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdf.base64 } }
}

async function llamarClaude(anthropic, prompt, pdfs) {
  const content = pdfs.length
    ? [...pdfs.map(bloqueDocumento), { type: 'text', text: prompt }]
    : prompt

  const msg = await anthropic.messages.create({
    model: MODELO_RESUMEN,
    max_tokens: 1536,
    messages: [{ role: 'user', content }],
  })
  const input = msg.usage?.input_tokens ?? 0
  const output = msg.usage?.output_tokens ?? 0
  return {
    text: msg.content[0].text,
    input,
    output,
    costeEuros: calcularCosteEuros({ inputSonnet: input, outputSonnet: output }),
  }
}

// Divide un PDF en bloques de N páginas para evitar límites de contexto
async function dividirPDFEnBloques(base64, paginasPorBloque = PAGINAS_POR_BLOQUE) {
  const original = await PDFDocument.load(Buffer.from(base64, 'base64'))
  const total = original.getPageCount()
  const bloques = []

  for (let inicio = 0; inicio < total; inicio += paginasPorBloque) {
    const fin = Math.min(inicio + paginasPorBloque, total)
    const nuevo = await PDFDocument.create()
    const indices = Array.from({ length: fin - inicio }, (_, i) => inicio + i)
    const copiadas = await nuevo.copyPages(original, indices)
    copiadas.forEach(p => nuevo.addPage(p))
    bloques.push(Buffer.from(await nuevo.save()).toString('base64'))
  }

  return bloques
}

// Procesa un PDF muy extenso: resume cada bloque con Haiku, luego sintetiza con Sonnet
async function resumenPorBloques(anthropic, promptOriginal, pdf) {
  const bloques = await dividirPDFEnBloques(pdf.base64)
  let inputHaiku = 0
  let outputHaiku = 0
  const parciales = []

  for (let i = 0; i < bloques.length; i++) {
    const promptBloque = `Este es el bloque ${i + 1} de ${bloques.length} de un pliego de licitación pública. Resume en español, de forma breve, las características técnicas (medidas, volúmenes, materiales) y la documentación a presentar que aparezcan en este bloque. Céntrate solo en lo que aparece en estas páginas.`

    const msg = await anthropic.messages.create({
      model: MODELO_BLOQUE,
      max_tokens: 1024,
      messages: [{ role: 'user', content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: bloques[i] } },
        { type: 'text', text: promptBloque },
      ]}],
    })
    parciales.push(msg.content[0].text)
    inputHaiku += msg.usage?.input_tokens ?? 0
    outputHaiku += msg.usage?.output_tokens ?? 0
  }

  const promptFinal = `${promptOriginal}

El pliego es muy extenso y se ha resumido por bloques. Aquí tienes los resúmenes, en orden:

${parciales.map((r, i) => `--- Bloque ${i + 1} ---\n${r}`).join('\n\n')}

Sintetiza toda esta información siguiendo la estructura de apartados pedida, sin perder ninguna característica técnica ni documento mencionado.`

  const final = await anthropic.messages.create({
    model: MODELO_RESUMEN,
    max_tokens: 1536,
    messages: [{ role: 'user', content: promptFinal }],
  })
  const inputSonnet = final.usage?.input_tokens ?? 0
  const outputSonnet = final.usage?.output_tokens ?? 0
  return {
    text: final.content[0].text,
    input: inputHaiku + inputSonnet,
    output: outputHaiku + outputSonnet,
    costeEuros: calcularCosteEuros({ inputSonnet, outputSonnet, inputHaiku, outputHaiku }),
  }
}

// Punto de entrada principal: intenta con los PDFs, reintenta sin el más grande
// si la llamada falla por tamaño (400), y como último recurso procesa por bloques.
async function generarResumen(apiKey, prompt, pdfs) {
  const anthropic = new Anthropic({ apiKey })

  if (pdfs.length === 0) return llamarClaude(anthropic, prompt, [])

  try {
    return await llamarClaude(anthropic, prompt, pdfs)
  } catch (err) {
    if (err.status !== 400) return llamarClaude(anthropic, prompt, [])

    const [masGrande, ...resto] = [...pdfs].sort((a, b) => b.bytes - a.bytes)

    if (resto.length > 0) {
      try { return await llamarClaude(anthropic, prompt, resto) } catch (e) {
        if (e.status !== 400) return llamarClaude(anthropic, prompt, [])
      }
    }

    try { return await resumenPorBloques(anthropic, prompt, masGrande) } catch {
      return llamarClaude(anthropic, prompt, [])
    }
  }
}

module.exports = { generarResumen, construirPromptResumen }
