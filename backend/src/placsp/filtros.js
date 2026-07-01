const { getText, getCPVFromClassification } = require('./parser')

// TypeCode en el feed PLACSP:
// 1=Suministros, 2=Servicios, 3=Obras, 8=Desconocido,
// 22=Concesión de servicios, 50=Concesión mixta
function tieneCPV45(entry) {
  const cpv = getCPVFromClassification(
    entry?.ContractFolderStatus?.ProcurementProject?.RequiredCommodityClassification
  )
  return cpv ? cpv.split(/\s+/).some(c => c.startsWith('45')) : false
}

function cpvCoincide(entry, codigo) {
  const cpv = getCPVFromClassification(
    entry?.ContractFolderStatus?.ProcurementProject?.RequiredCommodityClassification
  )
  return cpv ? cpv.includes(codigo) : false
}

function esObra(entry) {
  const typeCode = getText(entry?.ContractFolderStatus?.ProcurementProject?.TypeCode) || ''
  if (typeCode === '3') return true               // Obras puras
  if (typeCode === '1' || typeCode === '22') return false // Suministros / concesión servicios
  return tieneCPV45(entry)                        // Resto → solo si CPV 45
}

function estaEnPlazo(entry) {
  const fechaLimite = getText(
    entry?.ContractFolderStatus?.TenderingProcess?.TenderSubmissionDeadlinePeriod?.EndDate
  )
  if (!fechaLimite) return true
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return new Date(fechaLimite + 'T00:00:00') >= hoy
}

module.exports = { tieneCPV45, cpvCoincide, esObra, estaEnPlazo }
