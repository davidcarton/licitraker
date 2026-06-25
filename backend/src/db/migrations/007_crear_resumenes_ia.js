exports.up = knex => knex.schema.createTable('resumenes_ia', t => {
  t.increments('id').primary()
  t.string('expediente', 200).notNullable().unique()
  t.text('resumen').notNullable()
  t.integer('pliegos_encontrados').defaultTo(0)
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('resumenes_ia')
