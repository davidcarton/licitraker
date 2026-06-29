exports.up = knex => knex.schema.alterTable('resumenes_ia', t => {
  t.text('titulo').nullable()
  t.string('organismo', 500).nullable()
  t.string('importe', 100).nullable()
  t.string('fecha_limite', 50).nullable()
})

exports.down = knex => knex.schema.alterTable('resumenes_ia', t => {
  t.dropColumn('titulo')
  t.dropColumn('organismo')
  t.dropColumn('importe')
  t.dropColumn('fecha_limite')
})
