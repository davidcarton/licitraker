require('dotenv').config()

const bcrypt = require('bcryptjs')
const db = require('../src/db')

const EMAIL = 'david.carton@benco.es'
const PASSWORD = '12345678'
const NOMBRE = 'David Carton'
const NOMBRE_EMPRESA = 'LiciTracker Admin'

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  const existente = await db('usuarios').where({ email: EMAIL }).first()

  if (existente) {
    await db('usuarios')
      .where({ id: existente.id })
      .update({ rol: 'superadmin', password_hash: passwordHash, activo: true, updated_at: db.fn.now() })
    console.log(`Usuario existente actualizado a superadmin: ${EMAIL} (id ${existente.id})`)
    return
  }

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

main()
  .catch(err => {
    console.error('Error al crear el superadmin:', err.message)
    process.exitCode = 1
  })
  .finally(() => db.destroy())
