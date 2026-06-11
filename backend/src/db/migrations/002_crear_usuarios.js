exports.up = knex => knex.schema.createTable('usuarios', t => {
  t.increments('id').primary()
  t.integer('empresa_id').references('id').inTable('empresas').onDelete('CASCADE')
  t.string('nombre', 200).notNullable()
  t.string('email', 200).unique().notNullable()
  t.string('password_hash', 200).notNullable()
  t.string('rol', 20).defaultTo('user')
  t.boolean('activo').defaultTo(true)
  t.timestamp('ultimo_acceso')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('usuarios')
