exports.up = knex => knex.schema.createTable('preferencias', t => {
  t.increments('id').primary()
  t.integer('empresa_id').references('id').inTable('empresas').onDelete('CASCADE').unique()
  t.specificType('tipos_obra', 'text[]')
  t.specificType('provincias', 'text[]')
  t.decimal('importe_min')
  t.decimal('importe_max')
  t.string('frecuencia_alerta', 20).defaultTo('inmediata')
  t.timestamps(true, true)
})

exports.down = knex => knex.schema.dropTable('preferencias')
