exports.up = knex => knex.schema.table('empresas', t => {
  t.decimal('precio_mensual', 10, 2).nullable()
})

exports.down = knex => knex.schema.table('empresas', t => {
  t.dropColumn('precio_mensual')
})
