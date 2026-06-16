require('dotenv').config()

const bcrypt = require('bcryptjs')
const db = require('../src/db')

const EMAIL = 'info@constructoragarcia.com'
const PASSWORD = 'nuria2026'
const NOMBRE = 'Nuria García'
const NOMBRE_EMPRESA = 'Constructora García'

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  const existente = await db('usuarios').where({ email: EMAIL }).first()

  if (existente) {
    await db('usuarios')
      .where({ id: existente.id })
      .update({ password_hash: passwordHash, activo: true })
    console.log(`Usuario ya existía, contraseña actualizada: ${EMAIL}`)
    return
  }

  await db.transaction(async trx => {
    const [empresa] = await trx('empresas')
      .insert({ nombre: NOMBRE_EMPRESA, email_contacto: EMAIL, plan: 'pro' })
      .returning('*')

    const [usuario] = await trx('usuarios')
      .insert({
        empresa_id: empresa.id,
        nombre: NOMBRE,
        email: EMAIL,
        password_hash: passwordHash,
        rol: 'user'
      })
      .returning('*')

    console.log(`Empresa creada: ${empresa.nombre} (id ${empresa.id})`)
    console.log(`Usuario creado: ${usuario.email} (id ${usuario.id}, rol ${usuario.rol})`)
  })
}

main()
  .catch(err => {
    console.error('Error:', err.message)
    process.exitCode = 1
  })
  .finally(() => db.destroy())
