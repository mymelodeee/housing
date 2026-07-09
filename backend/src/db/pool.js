const { Pool, types } = require('pg');
const env = require('../config/env');

types.setTypeParser(types.builtins.NUMERIC, (value) => (value === null ? null : parseFloat(value)));

const pool = new Pool({ connectionString: env.postgresConnectionString });

pool.on('error', (err) => console.error('[ERROR] PostgreSQL pool error:', err.message));

module.exports = pool;
