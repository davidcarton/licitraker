'use strict'

let todasLicitaciones = []
let ultimaActualizacion = null

// ─── Utilidades ────────────────────────────────────────────────────────────────

function esc(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatearImporte(valor) {
  if (!valor && valor !== 0) return 'Consultar pliego'
  const num = parseFloat(valor)
  if (isNaN(num)) return 'Consultar pliego'
  return num.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return 'Sin plazo definido'
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  const d = new Date(fechaStr)
  if (isNaN(d.getTime())) return String(fechaStr)
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

function diasRestantes(fechaStr) {
  if (!fechaStr) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const limite = new Date(fechaStr)
  if (isNaN(limite.getTime())) return null
  return Math.ceil((limite - hoy) / (1000 * 60 * 60 * 24))
}

function badgeUrgencia(fechaLimite) {
  const dias = diasRestantes(fechaLimite)
  if (dias === null) {
    return { clase: 'badge-gris', texto: 'Sin plazo definido' }
  }
  if (dias > 14) {
    return { clase: 'badge-verde', texto: `✓ En plazo — ${dias} días` }
  }
  if (dias >= 7) {
    return { clase: 'badge-ambar', texto: `⚡ Plazo próximo — ${dias} días` }
  }
  return { clase: 'badge-rojo', texto: `🔴 Urgente — ${dias} días` }
}

function descripcionCPV(cpvStr) {
  if (!cpvStr) return 'Obra de construcción'
  const principal = String(cpvStr).split(/\s+/).find(c => c.startsWith('45')) || ''
  const prefijo = principal.substring(0, 3)
  const tabla = {
    '450': 'Construcción general',
    '451': 'Demolición y preparación',
    '452': 'Ingeniería civil',
    '453': 'Instalaciones en edificios',
    '454': 'Acabados de construcción',
    '455': 'Alquiler de maquinaria',
  }
  if (tabla[prefijo]) return tabla[prefijo]
  const p2 = principal.substring(0, 2)
  if (p2 === '45') return 'Obra de construcción'
  return 'Obra de construcción'
}

// ─── Tarjeta HTML ──────────────────────────────────────────────────────────────

function ubicacionTexto(l) {
  if (l.municipio && l.provincia) return `${l.municipio} · ${l.provincia}`
  return l.municipio || l.provincia || 'España'
}

function crearTarjetaHTML(l) {
  const badge = badgeUrgencia(l.fechaLimite)
  const cpvPrincipal = l.cpv
    ? (String(l.cpv).split(/\s+/).find(c => c.startsWith('45')) || l.cpv.split(/\s+/)[0])
    : ''

  const tieneEnlace = l.enlace && l.enlace !== '#'
  const btnAttr = tieneEnlace
    ? `href="${esc(l.enlace)}" target="_blank" rel="noopener noreferrer"`
    : ''
  const btnDisabled = tieneEnlace ? '' : 'disabled'

  return `
  <article class="card">
    <div class="card-header">
      <span class="badge ${badge.clase}">${esc(badge.texto)}</span>
      <span class="card-cpv-code">${esc(cpvPrincipal)}</span>
    </div>

    <h2 class="card-title" title="${esc(l.titulo)}">${esc(l.titulo || 'Sin título')}</h2>

    <div class="card-organismo">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
      <span title="${esc(l.organismo)}">${esc(l.organismo || 'No especificado')}</span>
    </div>

    <div class="card-data">
      <div class="card-datum">
        <span class="label">💰 Presupuesto</span>
        <span class="val">${esc(formatearImporte(l.importe))}</span>
      </div>
      <div class="card-datum">
        <span class="label">📅 Fecha límite</span>
        <span class="val">${esc(formatearFecha(l.fechaLimite))}</span>
      </div>
      <div class="card-datum">
        <span class="label">📍 Ubicación</span>
        <span class="val">${esc(ubicacionTexto(l))}</span>
      </div>
      <div class="card-datum">
        <span class="label">🏗 Tipo</span>
        <span class="val">${esc(descripcionCPV(l.cpv))}</span>
      </div>
      <div class="card-datum">
        <span class="label">📋 Expediente</span>
        <span class="val mono">${esc(l.expediente || '—')}</span>
      </div>
    </div>

    <div class="card-footer-actions">
      ${tieneEnlace
        ? `<a class="btn-enlace" ${btnAttr}>Ver licitación oficial →</a>`
        : `<button class="btn-enlace" disabled>Enlace no disponible</button>`
      }
      <span class="card-pub">Publicado: ${esc(formatearFecha(l.fechaPublicacion))}</span>
    </div>
  </article>`
}

// ─── Render ────────────────────────────────────────────────────────────────────

function renderizarTarjetas(lista) {
  const grid = document.getElementById('grid-licitaciones')
  if (lista.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <p>No hay resultados con estos filtros. Prueba a ampliar la búsqueda.</p>
    </div>`
    return
  }
  grid.innerHTML = lista.map(crearTarjetaHTML).join('')
}

let proximaActualizacion = null

function actualizarContador(n) {
  const el = document.getElementById('contador-texto')
  if (!ultimaActualizacion) { el.textContent = 'Cargando...'; return }
  const h = ultimaActualizacion.getHours().toString().padStart(2, '0')
  const m = ultimaActualizacion.getMinutes().toString().padStart(2, '0')
  const total = typeof n === 'number' ? n : todasLicitaciones.length
  let texto = `${total} licitaciones de construcción en plazo · Actualizado hoy a las ${h}:${m}`
  if (proximaActualizacion) {
    const ph = proximaActualizacion.getHours().toString().padStart(2, '0')
    const pm = proximaActualizacion.getMinutes().toString().padStart(2, '0')
    texto += ` · Próxima actualización: ${ph}:${pm}h`
  }
  el.textContent = texto
}

function mostrarSpinner() {
  document.getElementById('spinner').style.display = 'flex'
  document.getElementById('error-box').style.display = 'none'
  document.getElementById('grid-licitaciones').innerHTML = ''
}

function mostrarError(msg) {
  document.getElementById('spinner').style.display = 'none'
  const box = document.getElementById('error-box')
  box.style.display = 'block'
  box.innerHTML = `<strong>Error al obtener datos:</strong> ${esc(msg)}`
}

// ─── Filtros ───────────────────────────────────────────────────────────────────

function aplicarFiltros() {
  const texto = document.getElementById('filtro-texto').value.toLowerCase().trim()
  const importe = document.getElementById('filtro-importe').value

  const resultado = todasLicitaciones.filter(l => {
    if (texto) {
      const enTitulo = l.titulo && l.titulo.toLowerCase().includes(texto)
      const enOrg = l.organismo && l.organismo.toLowerCase().includes(texto)
      if (!enTitulo && !enOrg) return false
    }
    if (importe && l.importe != null) {
      const imp = parseFloat(l.importe)
      if (importe === 'menos50'   && imp >= 50000)               return false
      if (importe === '50a200'    && (imp < 50000 || imp >= 200000))  return false
      if (importe === '200a1000'  && (imp < 200000 || imp >= 1000000)) return false
      if (importe === 'mas1000'   && imp < 1000000)              return false
    }
    return true
  })

  renderizarTarjetas(resultado)
  actualizarContador(resultado.length)
}

// ─── Carga ─────────────────────────────────────────────────────────────────────

async function cargarLicitaciones(forzar = false) {
  mostrarSpinner()
  const url = forzar ? '/api/licitaciones?refresh=1' : '/api/licitaciones'
  try {
    const res = await fetch(url)
    const data = await res.json()
    document.getElementById('spinner').style.display = 'none'
    if (data.error) { mostrarError(data.error); return }
    todasLicitaciones = data.licitaciones || []
    ultimaActualizacion = new Date(data.actualizacion)
    proximaActualizacion = data.proximaActualizacion ? new Date(data.proximaActualizacion) : null
    if (todasLicitaciones.length === 0) {
      document.getElementById('grid-licitaciones').innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>No se han encontrado licitaciones de construcción en plazo en este momento.<br>El sistema volverá a buscar automáticamente.</p>
        </div>`
      actualizarContador(0)
      return
    }
    aplicarFiltros()
  } catch (err) {
    mostrarError('No se pudo conectar con el servidor: ' + err.message)
  }
}

// ─── Eventos ───────────────────────────────────────────────────────────────────

let debounceTimer
document.getElementById('filtro-texto').addEventListener('input', () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(aplicarFiltros, 300)
})
document.getElementById('filtro-importe').addEventListener('change', aplicarFiltros)
document.getElementById('btn-actualizar').addEventListener('click', () => cargarLicitaciones(true))

// ─── Arranque ──────────────────────────────────────────────────────────────────

cargarLicitaciones()
