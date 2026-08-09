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
      
      // Try run the query
      console.log('Executing toggle to false...');
      await client.query(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ['jewellery_enabled', 'false']
      );
      console.log('Query finished successfully!');
      
      const res = await client.query("SELECT * FROM settings WHERE key = 'jewellery_enabled'");
      console.log('Result settings row:', res.rows);
      
      client.release();
    } catch (err) {
      console.error('Error executing query:', err.message);
    } finally {
      await pool.end();
    }
  }

  main();
}
