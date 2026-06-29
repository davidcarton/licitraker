exports.up = knex => knex.schema.alterTable('resumenes_ia', t => {
  t.decimal('coste_euros', 10, 6).nullable()
})

exports.down = knex => knex.schema.alterTable('resumenes_ia', t => {
  t.dropColumn('coste_euros')
})
