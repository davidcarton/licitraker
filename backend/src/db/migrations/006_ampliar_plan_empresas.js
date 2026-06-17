exports.up = knex => knex.schema.alterTable('empresas', t => {
  t.string('plan', 50).alter()
})

exports.down = knex => knex.schema.alterTable('empresas', t => {
  t.string('plan', 20).alter()
})
