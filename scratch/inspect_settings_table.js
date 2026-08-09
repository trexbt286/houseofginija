const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

if (dbUrl) {
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  async function main() {
    try {
      const client = await pool.connect();
      console.log('Connected to CockroachDB!');
      const res = await client.query('SELECT * FROM settings');
      console.log('Current CockroachDB settings table rows:', res.rows);
      client.release();
    } catch (err) {
      console.error('CockroachDB error:', err.message);
    } finally {
      await pool.end();
    }
  }

  main();
}
