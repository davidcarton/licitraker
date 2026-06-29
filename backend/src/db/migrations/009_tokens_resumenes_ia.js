exports.up = knex => knex.schema.alterTable('resumenes_ia', t => {
  t.integer('tokens_input').nullable()
  t.integer('tokens_output').nullable()
})

exports.down = knex => knex.schema.alterTable('resumenes_ia', t => {
  t.dropColumn('tokens_input')
  t.dropColumn('tokens_output')
})
