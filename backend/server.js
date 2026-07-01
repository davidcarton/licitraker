require('dotenv').config()

const express = require('express')
const cors = require('cors')
const os = require('os')
const path = require('path')
const fs = require('fs')

const { medirLatencia, registrarPeticionesFallidas } = require('./src/middleware/metricas')
const logger = require('./src/utils/logger')

const authRoutes = require('./src/routes/auth')
const licitacionesRoutes = require('./src/routes/licitaciones')
const adminRoutes = require('./src/routes/admin')
const clientesRoutes = require('./src/routes/clientes')
const placspRoutes = require('./src/routes/placsp')
const resumenesRoutes = require('./src/routes/resumenes')

const { iniciarCron } = require('./src/cron')
const { descargarYProcesar } = require('./src/placsp/descarga')

// ─── Configuración Express ──────────────────────────────────────────────────────

const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean)

const app = express()
app.use(cors(corsOrigins.length ? { origin: corsOrigins, credentials: true } : { origin: true, credentials: true }))
app.use(express.json())
app.use(medirLatencia)
app.use(registrarPeticionesFallidas(logger))

// ─── Rutas API ──────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes)
app.use('/api/licitaciones-guardadas', licitacionesRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin/clientes', clientesRoutes)
app.use('/api', placspRoutes)
app.use('/api', resumenesRoutes)

// Capturar rutas /api/* no reconocidas antes de que lleguen al SPA
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' })
})

// ─── Frontend React (build de producción) ───────────────────────────────────────

const clientDist = path.join(__dirname, '..', 'client', 'dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('/{*path}', (req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

// ─── Arranque ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nLiciTracker corriendo en http://localhost:${PORT}`)

  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const iface of ifaces) {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`Accesible en red local: http://${iface.address}:${PORT}`)
      }
    }
  }

  console.log('\nHorarios de actualización: 07:00, 12:00 y 18:00 (L-V)')
  iniciarCron()
  console.log('Descargando datos iniciales...')
  descargarYProcesar()
})
