/**
 * seed-demo.js — Crea empresa y usuario de demo para presentaciones
 * Uso: node seed-demo.js
 */
require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('./src/db')

const EMPRESA = {
  nombre: 'Constructoras del Norte S.L.',
  cif: 'B98765432',
  email_contacto: 'contacto@constructorasnorte.es',
  telefono: '948 123 456',
  plan: 'pro',
  activa: true,
}

const USUARIO = {
  nombre: 'María López',
  email: 'maria@constructorasnorte.es',
  password: 'Demo2024!',
  rol: 'admin',
  activo: true,
}

const LICITACIONES_DEMO = [
  {
    licitacion_id: 'DEMO-2024-001',
    titulo: 'Rehabilitación integral de fachadas en el Casco Antiguo de Pamplona',
    organismo: 'Ayuntamiento de Pamplona',
    importe: 285000,
    fecha_limite: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    provincia: 'Navarra',
    municipio: 'Pamplona',
    cpv: '45443000',
    enlace: 'https://contrataciondelsectorpublico.gob.es',
    estado: 'guardada',
  },
  {
    licitacion_id: 'DEMO-2024-002',
    titulo: 'Construcción de nave industrial en polígono Los Llanos',
    organismo: 'Consorcio Industrial de La Rioja',
    importe: 890000,
    fecha_limite: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    provincia: 'La Rioja',
    municipio: 'Logroño',
    cpv: '45213270',
    enlace: 'https://contrataciondelsectorpublico.gob.es',
    estado: 'guardada',
  },
  {
    licitacion_id: 'DEMO-2024-003',
    titulo: 'Urbanización y pavimentación de calle Mayor, tramo norte',
    organismo: 'Ayuntamiento de Vitoria-Gasteiz',
    importe: 520000,
    fecha_limite: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    provincia: 'Álava',
    municipio: 'Vitoria-Gasteiz',
    cpv: '45233141',
    enlace: 'https://contrataciondelsectorpublico.gob.es',
    estado: 'guardada',
  },
  {
    licitacion_id: 'DEMO-2024-004',
    titulo: 'Instalación de red de saneamiento y pluviales en sector Norte',
    organismo: 'Mancomunidad de Municipios Vascos',
    importe: 340000,
    fecha_limite: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    provincia: 'Bizkaia',
    municipio: 'Bilbao',
    cpv: '45232400',
    enlace: 'https://contrataciondelsectorpublico.gob.es',
    estado: 'guardada',
  },
  {
    licitacion_id: 'DEMO-2024-005',
    titulo: 'Mejora de accesibilidad y remodelación de plaza central',
    organismo: 'Diputación Foral de Navarra',
    importe: 185000,
    fecha_limite: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    provincia: 'Navarra',
    municipio: 'Tudela',
    cpv: '45111291',
    enlace: 'https://contrataciondelsectorpublico.gob.es',
    estado: 'presentada',
  },
]

async function main() {
  console.log('Creando empresa demo...')

  let empresa = await db('empresas').where({ cif: EMPRESA.cif }).first()

  if (!empresa) {
    const [e] = await db('empresas').insert(EMPRESA).returning('*')
    empresa = e
    console.log(`✓ Empresa creada: ${empresa.nombre} (id: ${empresa.id})`)
  } else {
    console.log(`→ Empresa ya existe: ${empresa.nombre} (id: ${empresa.id})`)
  }

  let usuario = await db('usuarios').where({ email: USUARIO.email }).first()

  if (!usuario) {
    const hash = await bcrypt.hash(USUARIO.password, 10)
    const [u] = await db('usuarios').insert({
      empresa_id: empresa.id,
      nombre: USUARIO.nombre,
      email: USUARIO.email,
      password_hash: hash,
      rol: USUARIO.rol,
      activo: USUARIO.activo,
    }).returning('*')
    usuario = u
    console.log(`✓ Usuario creado: ${usuario.email}`)
  } else {
    console.log(`→ Usuario ya existe: ${usuario.email}`)
  }

  for (const lic of LICITACIONES_DEMO) {
    const existe = await db('licitaciones_guardadas')
      .where({ empresa_id: empresa.id, licitacion_id: lic.licitacion_id }).first()
    if (!existe) {
      await db('licitaciones_guardadas').insert({ empresa_id: empresa.id, ...lic })
      console.log(`✓ Licitación demo: ${lic.titulo.slice(0, 50)}...`)
    }
  }

  console.log('\n=== CREDENCIALES DE DEMO ===')
  console.log(`Email:      ${USUARIO.email}`)
  console.log(`Contraseña: ${USUARIO.password}`)
  console.log('============================\n')

  await db.destroy()
}

main().catch(e => { console.error(e); process.exit(1) })
