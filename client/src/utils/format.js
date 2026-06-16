export function diasRestantes(fechaStr) {
  if (!fechaStr) return null
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  return Math.ceil((new Date(fechaStr + 'T00:00:00') - hoy) / (1000*60*60*24))
}

export function tipoBadge(fechaStr) {
  const d = diasRestantes(fechaStr)
  if (d === null) return 'sinplazo'
  if (d < 7) return 'urgente'
  if (d <= 14) return 'proximo'
  return 'enplazo'
}

export function formatFecha(fechaStr) {
  if (!fechaStr) return null
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  const d = new Date(fechaStr)
  if (isNaN(d)) return fechaStr
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

export function formatImporte(valor) {
  if (!valor && valor !== 0) return null
  const n = parseFloat(valor)
  if (isNaN(n)) return null
  return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const CPV_DESCRIPCIONES = {
  '450': 'Construcción general',
  '451': 'Demolición y preparación del terreno',
  '452': 'Ingeniería civil',
  '453': 'Instalaciones en edificios',
  '454': 'Acabados de construcción',
  '455': 'Alquiler de maquinaria de construcción',
}

export function descripcionCPV(cpvStr) {
  if (!cpvStr) return 'Obra de construcción'
  const p = String(cpvStr).split(/\s+/).find(c => c.startsWith('45')) || ''
  return CPV_DESCRIPCIONES[p.substring(0,3)] || 'Obra de construcción'
}
