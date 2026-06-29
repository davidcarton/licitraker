exports.up = async knex => {
  await knex.schema.alterTable('resumenes_ia', t => {
    t.integer('empresa_id').nullable().references('id').inTable('empresas').onDelete('CASCADE')
  })
  await knex.raw('ALTER TABLE resumenes_ia DROP CONSTRAINT IF EXISTS resumenes_ia_expediente_unique')
  await knex.raw('CREATE UNIQUE INDEX resumenes_ia_expediente_empresa_unique ON resumenes_ia (expediente, empresa_id)')
}

exports.down = async knex => {
  await knex.raw('DROP INDEX IF EXISTS resumenes_ia_expediente_empresa_unique')
  await knex.raw('ALTER TABLE resumenes_ia DROP CONSTRAINT IF EXISTS resumenes_ia_empresa_id_foreign')
  await knex.schema.alterTable('resumenes_ia', t => {
    t.dropColumn('empresa_id')
  })
  await knex.raw('CREATE UNIQUE INDEX resumenes_ia_expediente_unique ON resumenes_ia (expediente)')
}
