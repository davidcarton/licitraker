require('dotenv').config()

const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const db = require('../src/db')

const EMAIL = process.env.SUPERADMIN_EMAIL || 'david.carton@benco.es'
const NOMBRE = process.env.SUPERADMIN_NOMBRE || 'David Carton'
const NOMBRE_EMPRESA = 'LiciTracker Admin'

async function main() {
  let password = process.env.SUPERADMIN_PASSWORD
  let generada = false
  if (!password) {
    password = crypto.randomBytes(18).toString('base64').replace(/[+/=]/g, '')
    generada = true
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const existente = await db('usuarios').where({ email: EMAIL }).first()

  if (existente) {
    await db('usuarios')
      .where({ id: existente.id })
      .update({ rol: 'superadmin', password_hash: passwordHash, activo: true, updated_at: db.fn.now() })
    console.log(`Usuario existente actualizado a superadmin: ${EMAIL} (id ${existente.id})`)
  } else {
    await db.transaction(async trx => {
      const [empresa] = await trx('empresas')
        .insert({ nombre: NOMBRE_EMPRESA, email_contacto: EMAIL, plan: 'admin' })
        .returning('*')

      const [usuario] = await trx('usuarios')
        .insert({
          empresa_id: empresa.id,
          nombre: NOMBRE,
          email: EMAIL,
          password_hash: passwordHash,
          rol: 'superadmin'
        })
        .returning('*')

      console.log(`Superadmin creado: ${usuario.email} (id ${usuario.id}, empresa ${empresa.nombre})`)
    })
  }

  if (generada) {
    console.log(`Contraseña generada: ${password}`)
    console.log('Guárdala ahora: no volverá a mostrarse.')
  }
}

main()
  .catch(err => {
    console.error('Error al crear el superadmin:', err.message)
    process.exitCode = 1
  })
  .finally(() => db.destroy())
