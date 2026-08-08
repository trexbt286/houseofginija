const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
if (!match) {
  console.log('No DB URL found');
  process.exit(0);
}

const dbUrl = match[1].trim().replace(/^['"]|['"]$/g, '');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

async function main() {
  try {
    const client = await pool.connect();
    console.log('Connected to CockroachDB!');
    const res = await client.query(`
      UPDATE products
      SET collection_id = 8
      WHERE id IN ('1', '101', '2', '12')
         OR LOWER(name) LIKE '%drape%'
         OR LOWER(name) LIKE '%cape%'
      RETURNING id, name, collection_id
    `);
    console.log('Successfully updated CockroachDB Indo-Western rows:', res.rows);
    client.release();
  } catch (err) {
    console.error('CockroachDB update error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
