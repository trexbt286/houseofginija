const fs = require('fs');
const { Pool } = require('pg');
const { getStore } = require('../src/lib/globalProductStore');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

console.log('Searching globalProductStore for Muslin...');
const store = getStore();
const storeMatches = store.filter(p => (p.name || '').toLowerCase().includes('muslin') || (p.name || '').toLowerCase().includes('santoon') || (p.name || '').toLowerCase().includes('kurta'));
console.log('Store matches count:', storeMatches.length);
console.log('Store matches:', storeMatches.map(p => ({ id: p.id, name: p.name, collection_id: p.collection_id, collection_slug: p.collection_slug, collection_slugs: p.collection_slugs })));

if (dbUrl) {
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  async function main() {
    const client = await pool.connect();
    const res = await client.query("SELECT id, name, slug, collection_id FROM products WHERE LOWER(name) LIKE '%muslin%' OR LOWER(name) LIKE '%santoon%' OR LOWER(name) LIKE '%kurta%'");
    console.log('CockroachDB matches count:', res.rows.length);
    console.log('CockroachDB matches:', res.rows);
    client.release();
    await pool.end();
  }

  main();
}
