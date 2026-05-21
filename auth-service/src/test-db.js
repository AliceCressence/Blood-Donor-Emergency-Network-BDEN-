const { Pool } = require('pg')

const pool = new Pool({
  host:     '127.0.0.1',
  port:     5433,
  database: 'bden_auth',
  user:     'bden_user',
  password: 'bden1234',
})

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error:', err.message)
  } else {
    console.log('✅ Connected successfully!')
    release()
  }
  pool.end()
})
