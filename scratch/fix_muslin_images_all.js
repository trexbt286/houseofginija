const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

const validMuslinImages = [
  '/local-products/002-bespoke-suit-6-1.jpg',
  '/local-products/003-bespoke-suit-10-1.jpg'
];

// 1. Update local-products-fallback.json
const prodsPath = './src/data/local-products-fallback.json';
const homePath = './src/data/local-homepage-fallback.json';

const prodsData = JSON.parse(fs.readFileSync(prodsPath, 'utf8'));
const homeData = JSON.parse(fs.readFileSync(homePath, 'utf8'));

for (const p of prodsData.products) {
  if (p.slug === 'muslin-kurta-and-dupatta-bottom-santoon' || (p.name || '').toLowerCase().includes('muslin kurta')) {
    p.images = validMuslinImages;
  }
}

fs.writeFileSync(prodsPath, JSON.stringify(prodsData, null, 2), 'utf8');
console.log('Muslin kurta image paths updated in local-products-fallback.json!');

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
        SET images = $1
        WHERE slug = 'muslin-kurta-and-dupatta-bottom-santoon' OR LOWER(name) LIKE '%muslin kurta%'
      `, [JSON.stringify(validMuslinImages)]);

      const res = await client.query(`
        SELECT id, name, images FROM products WHERE slug = 'muslin-kurta-and-dupatta-bottom-santoon' OR LOWER(name) LIKE '%muslin kurta%'
      `);
      console.log('CockroachDB updated muslin product rows:', res.rows);

      client.release();
    } catch (err) {
      console.error('CockroachDB update error:', err.message);
    } finally {
      await pool.end();
    }
  }

  main();
}
