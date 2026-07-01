// Helpers para extraer valores de la estructura XML del feed PLACSP
// (parseado con xml2js en modo explicitArray:false)

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
    const alt = linkVal.find(l => l?.$?.rel === 'alternate')
    if (alt?.$) return alt.$.href || fallback
    const first = linkVal[0]
    if (first?.$) return first.$.href || fallback
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
  const codes = [].concat(classification).map(c => {
    const icc = c?.ItemClassificationCode
    if (!icc) return null
    if (typeof icc === 'string') return icc
    return icc._ || icc['#text'] || null
  }).filter(Boolean)
  return codes.length > 0 ? codes.join(' ') : null
}

function extraerUbicacion(entry) {
  const loc = entry?.ContractFolderStatus?.ProcurementProject?.RealizedLocation

  // Limpiar variantes bilingües "Valencia/València"
  let provincia = getText(loc?.CountrySubentity) || ''
  if (provincia.includes('/')) provincia = provincia.split('/')[0].trim()

  // Normalizar municipios en mayúsculas
  let municipio = getText(loc?.Address?.CityName) || ''
  if (municipio === municipio.toUpperCase() && municipio.length > 0) {
    municipio = municipio.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
    municipio = municipio.replace(/\b(De|Del|La|Los|Las|El|Y)\b/g, m => m.toLowerCase())
  }

  if (municipio.toLowerCase() === provincia.toLowerCase()) municipio = ''

  return { provincia: provincia || null, municipio: municipio || null }
}

function extraerDatos(entry) {
  try {
    const cfs = entry.ContractFolderStatus
    if (!cfs) return null
    const proj = cfs.ProcurementProject || {}
    const budget = proj.BudgetAmount || {}
    const deadline = (cfs.TenderingProcess || {}).TenderSubmissionDeadlinePeriod || {}
    const party = ((cfs.LocatedContractingParty || {}).Party) || {}

    return {
      titulo: getText(proj.Name),
      organismo: getText((party.PartyName || {}).Name),
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

function extraerEntradas(result) {
  const entries = result?.feed?.entry
  return entries ? [].concat(entries) : []
}

function encontrarSiguienteURL(result) {
  const links = result?.feed?.link
  if (!links) return null
  const next = [].concat(links).find(l => l?.$?.rel === 'next')
  return next ? next.$.href : null
}

module.exports = {
  getText, getFloat, getLink, getCPVFromClassification,
  extraerUbicacion, extraerDatos, extraerEntradas, encontrarSiguienteURL,
}
