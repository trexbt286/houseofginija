const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

// 1. Update local JSON fallbacks
const prodsPath = './src/data/local-products-fallback.json';
const prodsData = JSON.parse(fs.readFileSync(prodsPath, 'utf8'));

for (const p of prodsData.products) {
  const slug = (p.slug || '').toLowerCase();
  const name = (p.name || '').toLowerCase();

  const isJewellery = slug.includes('ring') || slug.includes('necklace') || slug.includes('earring') || slug.includes('bracelet') || name.includes('necklace') || name.includes('ring') || name.includes('earring') || name.includes('bracelet');

  if (isJewellery) {
    if (slug.includes('ring')) {
      p.collection_id = '5';
      p.collection_slug = 'rings';
      p.collection_name = 'Rings';
      p.collection_slugs = ['rings', 'jewellery'];
    } else if (slug.includes('necklace')) {
      p.collection_id = '2';
      p.collection_slug = 'necklaces';
      p.collection_name = 'Necklaces';
      p.collection_slugs = ['necklaces', 'jewellery'];
    } else if (slug.includes('bracelet')) {
      p.collection_id = '6';
      p.collection_slug = 'bracelets';
      p.collection_name = 'Bracelets';
      p.collection_slugs = ['bracelets', 'jewellery'];
    } else if (slug.includes('earring')) {
      p.collection_id = '4';
      p.collection_slug = 'earrings';
      p.collection_name = 'Earrings';
      p.collection_slugs = ['earrings', 'jewellery'];
    }
  }
}

fs.writeFileSync(prodsPath, JSON.stringify(prodsData, null, 2), 'utf8');
console.log('Local JSON fallback jewellery collection IDs updated!');

// 2. Update CockroachDB
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

      await client.query(`
        UPDATE products
        SET collection_id = 5
        WHERE slug LIKE '%ring%' AND slug NOT LIKE '%earring%'
      `);

      await client.query(`
        UPDATE products
        SET collection_id = 2
        WHERE slug LIKE '%necklace%'
      `);

      await client.query(`
        UPDATE products
        SET collection_id = 6
        WHERE slug LIKE '%bracelet%'
      `);

      await client.query(`
        UPDATE products
        SET collection_id = 4
        WHERE slug LIKE '%earring%'
      `);

      console.log('CockroachDB jewellery collection_ids updated successfully!');

      client.release();
    } catch (err) {
      console.error('CockroachDB error:', err.message);
    } finally {
      await pool.end();
    }
  }

  main();
}
