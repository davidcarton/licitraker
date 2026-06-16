const knex = require('knex')
const { types } = require('pg')
const config = require('../../knexfile')

// Devolver las columnas DATE como 'YYYY-MM-DD' (string) en vez de un objeto Date
types.setTypeParser(1082, val => val)

const env = process.env.NODE_ENV || 'development'

module.exports = knex(config[env])
