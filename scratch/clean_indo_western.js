const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

const targetIndoWesternSlugs = new Set([
  'blush-pink-drape-2',
  'chinnon-drape-skirt-with-embroidered-cape-and-hand-embroidered-blouse',
  'bespoke-suit-1',
  'bespoke-suit-12',
  'bespoke-suit-2'
]);

const targetIndoWesternIds = new Set(['1', '2', '12', '101', '102']);

// 1. Clean local fallbacks
const prodsPath = './src/data/local-products-fallback.json';
const homePath = './src/data/local-homepage-fallback.json';

const prodsData = JSON.parse(fs.readFileSync(prodsPath, 'utf8'));
const homeData = JSON.parse(fs.readFileSync(homePath, 'utf8'));

for (const p of prodsData.products) {
  const isTarget = targetIndoWesternIds.has(String(p.id)) || targetIndoWesternSlugs.has(p.slug);
  if (isTarget) {
    p.collection_id = '8';
    p.collection_name = 'Indo-Western';
    p.collection_slug = 'indo-western';
    p.collection_slugs = ['indo-western'];
  } else {
    if (p.collection_id === '8' || p.collection_slug === 'indo-western') {
      p.collection_id = '1';
      p.collection_name = 'Unstitched Suits';
      p.collection_slug = 'suits';
      p.collection_slugs = (p.collection_slugs || []).filter(s => s !== 'indo-western');
      if (p.collection_slugs.length === 0) p.collection_slugs = ['suits'];
    }
  }
}

fs.writeFileSync(prodsPath, JSON.stringify(prodsData, null, 2), 'utf8');

const iwFiltered = prodsData.products.filter(p => targetIndoWesternIds.has(String(p.id)) || targetIndoWesternSlugs.has(p.slug));
homeData.heavyDresses.indoWestern = iwFiltered;
fs.writeFileSync(homePath, JSON.stringify(homeData, null, 2), 'utf8');

console.log('Local fallback JSON files cleaned! Indo-Western count:', iwFiltered.length);

// 2. Clean CockroachDB if connected
if (dbUrl) {
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  async function updateDb() {
    try {
      const client = await pool.connect();
      console.log('Connected to CockroachDB for cleanup!');

      // Set non-target products back to collection_id 1
      const res1 = await client.query(`
        UPDATE products
        SET collection_id = 1
        WHERE collection_id = 8
          AND id NOT IN ('1', '2', '12', '101', '102')
          AND slug NOT IN ('blush-pink-drape-2', 'chinnon-drape-skirt-with-embroidered-cape-and-hand-embroidered-blouse', 'bespoke-suit-1', 'bespoke-suit-12', 'bespoke-suit-2')
        RETURNING id, name
      `);
      console.log('Reset non-Indo-Western rows in CockroachDB:', res1.rows.length);

      // Set target products to collection_id 8
      const res2 = await client.query(`
        UPDATE products
        SET collection_id = 8
        WHERE id IN ('1', '2', '12', '101', '102')
           OR slug IN ('blush-pink-drape-2', 'chinnon-drape-skirt-with-embroidered-cape-and-hand-embroidered-blouse', 'bespoke-suit-1', 'bespoke-suit-12', 'bespoke-suit-2')
        RETURNING id, name, collection_id
      `);
      console.log('CockroachDB Indo-Western target rows:', res2.rows);
      client.release();
    } catch (err) {
      console.error('CockroachDB update error:', err.message);
    } finally {
      await pool.end();
    }
  }

  updateDb();
}
