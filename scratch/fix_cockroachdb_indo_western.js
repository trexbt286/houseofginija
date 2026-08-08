const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

if (!dbUrl) {
  console.log('No DB URL');
  process.exit(0);
}

const targetIds = new Set(['1', '2', '12', '101', '102', '103', '1197283535333523457', '1197284438722019329']);

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

async function main() {
  const client = await pool.connect();
  console.log('Connected to CockroachDB!');

  // Reset ALL products to collection_id = 1 except the target 6 products!
  const resetRes = await client.query(`
    UPDATE products
    SET collection_id = 1
    WHERE id NOT IN ('1', '2', '12', '101', '102', '103', '1197283535333523457', '1197284438722019329')
  `);
  console.log('Reset non-Indo-Western products to collection_id = 1:', resetRes.rowCount);

  // Set the 6 target products to collection_id = 8 (Indo-Western)
  const targetRes = await client.query(`
    UPDATE products
    SET collection_id = 8
    WHERE id IN ('1', '2', '12', '101', '102', '103', '1197283535333523457', '1197284438722019329')
    RETURNING id, name, collection_id
  `);
  console.log('CockroachDB Indo-Western target rows count:', targetRes.rows.length);
  console.log('CockroachDB Indo-Western target rows:', targetRes.rows);

  client.release();
  await pool.end();
}

main();
