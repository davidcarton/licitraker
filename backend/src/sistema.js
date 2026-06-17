const os = require('os')
const { execSync } = require('child_process')

function obtenerCPU() {
  const carga = os.loadavg()
  const nucleos = os.cpus().length
  const porcentajeAprox = nucleos > 0 ? Math.min(100, Math.round((carga[0] / nucleos) * 100)) : null
  return {
    carga1m: Number(carga[0].toFixed(2)),
    carga5m: Number(carga[1].toFixed(2)),
    nucleos,
    porcentajeAprox,
  }
}

function obtenerMemoriaSistema() {
  const totalMB = Math.round(os.totalmem() / 1024 / 1024)
  const libreMB = Math.round(os.freemem() / 1024 / 1024)
  const usadoMB = totalMB - libreMB
  const porcentajeUso = totalMB > 0 ? Math.round((usadoMB / totalMB) * 100) : null
  return { totalMB, libreMB, porcentajeUso }
}

function convertirAGB(valor) {
  const match = String(valor).match(/^([\d.]+)([KMGT]?)$/i)
  if (!match) return null
  const numero = parseFloat(match[1])
  const unidad = (match[2] || '').toUpperCase()
  const factores = { K: 1 / (1024 * 1024), M: 1 / 1024, G: 1, T: 1024 }
  return Number((numero * (factores[unidad] ?? 1)).toFixed(1))
}

function obtenerDisco() {
  try {
    const salida = execSync('df -h /').toString()
    const lineas = salida.trim().split('\n')
    const columnas = lineas[1].trim().split(/\s+/)
    if (columnas.length < 6) return null
    const n = columnas.length
    const totalGB = convertirAGB(columnas[n - 5])
    const usadoGB = convertirAGB(columnas[n - 4])
    const porcentajeUso = parseInt(columnas[n - 2], 10)
    return { totalGB, usadoGB, porcentajeUso: isNaN(porcentajeUso) ? null : porcentajeUso }
  } catch {
    return null
  }
}

function obtenerDocker() {
  try {
    const salida = execSync('docker ps --format "{{.Names}}|{{.Status}}"').toString()
    const contenedores = salida.trim().split('\n').filter(Boolean).map(linea => {
      const [nombre, estado] = linea.split('|')
      return { nombre, estado }
    })
    return { disponible: true, contenedores }
  } catch {
    return { disponible: false, contenedores: [] }
  }
}

module.exports = { obtenerCPU, obtenerMemoriaSistema, obtenerDisco, obtenerDocker }
