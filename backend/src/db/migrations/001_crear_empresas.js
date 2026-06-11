exports.up = knex => knex.schema.createTable('empresas', t => {
  t.increments('id').primary()
  t.string('nombre', 200).notNullable()
  t.string('cif', 20).unique()
  t.string('email_contacto', 200)
  t.string('telefono', 20)
  t.text('direccion')
  t.string('plan', 20).defaultTo('starter')
  t.boolean('activa').defaultTo(true)
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('empresas')
