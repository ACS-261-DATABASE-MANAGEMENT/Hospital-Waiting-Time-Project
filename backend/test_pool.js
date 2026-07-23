require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
pool.query('SELECT NOW()')
  .then(res => { console.log("SUCCESS:", res.rows[0]); pool.end(); })
  .catch(err => { console.error("ERROR:", err.message); pool.end(); });
