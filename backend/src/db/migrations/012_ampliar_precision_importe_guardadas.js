exports.up = knex => knex.schema.alterTable('licitaciones_guardadas', t => {
  t.decimal('importe', 15, 2).alter()
})

exports.down = knex => knex.schema.alterTable('licitaciones_guardadas', t => {
  t.decimal('importe', 8, 2).alter()
})
