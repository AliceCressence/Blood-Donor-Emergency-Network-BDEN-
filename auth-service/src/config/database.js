const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'bden_auth',
  user: process.env.DB_USER || 'bden_user',
  password: process.env.DB_PASSWORD || 'bden1234',
});

module.exports = pool;