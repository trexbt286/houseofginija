const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

if (!dbUrl) {
  console.log('No DB URL');
  process.exit(0);
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

async function main() {
  const client = await pool.connect();
  const res = await client.query(`
    SELECT p.id, p.name, p.slug, p.collection_id, c.name as collection_name, c.slug as collection_slug
    FROM products p
    LEFT JOIN collections c ON c.id = p.collection_id
    WHERE p.collection_id = 8 OR LOWER(p.name) LIKE '%drape%' OR LOWER(p.name) LIKE '%chinnon%' OR LOWER(p.name) LIKE '%champagne%'
  `);
  console.log('CockroachDB Indo-Western / Drape products count:', res.rows.length);
  console.log('CockroachDB rows:', res.rows);
  client.release();
  await pool.end();
}

main();
