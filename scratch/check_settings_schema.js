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
      
      // Get table info
      const tableInfo = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'settings'
      `);
      console.log('Columns of settings table:', tableInfo.rows);

      // Get indexes info
      const indexInfo = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'settings'
      `);
      console.log('Indexes of settings table:', indexInfo.rows);
      
      client.release();
    } catch (err) {
      console.error('CockroachDB error:', err.message);
    } finally {
      await pool.end();
    }
  }

  main();
}
