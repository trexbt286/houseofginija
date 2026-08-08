const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

const updatedImageMap = {
  'Ice Blue Cape': ['/local-products/063-bespoke-suit-1-1.jpg', '/local-products/064-bespoke-suit-1-2.jpg'],
  'bespoke-suit-1': ['/local-products/063-bespoke-suit-1-1.jpg', '/local-products/064-bespoke-suit-1-2.jpg'],
  'Lavender Drape': ['/local-products/069-bespoke-suit-12-1.jpg'],
  'bespoke-suit-12': ['/local-products/069-bespoke-suit-12-1.jpg'],
  'Monochrome Drape': ['/local-products/073-bespoke-suit-2-1.jpg'],
  'bespoke-suit-2': ['/local-products/073-bespoke-suit-2-1.jpg'],
};

// 1. Update local-products-fallback.json
const prodsPath = './src/data/local-products-fallback.json';
const homePath = './src/data/local-homepage-fallback.json';

const prodsData = JSON.parse(fs.readFileSync(prodsPath, 'utf8'));
const homeData = JSON.parse(fs.readFileSync(homePath, 'utf8'));

for (const p of prodsData.products) {
  if (p.name === 'Ice Blue Cape' || p.id === '1' || p.slug === 'bespoke-suit-1') {
    p.images = updatedImageMap['Ice Blue Cape'];
  }
  if (p.name === 'Lavender Drape' || p.id === '12' || p.slug === 'bespoke-suit-12') {
    p.images = updatedImageMap['Lavender Drape'];
  }
  if (p.name === 'Monochrome Drape' || p.id === '2' || p.slug === 'bespoke-suit-2') {
    p.images = updatedImageMap['Monochrome Drape'];
  }
}

fs.writeFileSync(prodsPath, JSON.stringify(prodsData, null, 2), 'utf8');

// 2. Update local-homepage-fallback.json
for (const p of homeData.heavyDresses.indoWestern) {
  if (p.name === 'Ice Blue Cape' || p.id === '1' || p.slug === 'bespoke-suit-1') {
    p.images = updatedImageMap['Ice Blue Cape'];
  }
  if (p.name === 'Lavender Drape' || p.id === '12' || p.slug === 'bespoke-suit-12') {
    p.images = updatedImageMap['Lavender Drape'];
  }
  if (p.name === 'Monochrome Drape' || p.id === '2' || p.slug === 'bespoke-suit-2') {
    p.images = updatedImageMap['Monochrome Drape'];
  }
}

fs.writeFileSync(homePath, JSON.stringify(homeData, null, 2), 'utf8');

console.log('Successfully updated local fallback JSON image paths for Ice Blue Cape, Lavender Drape, Monochrome Drape!');

// 3. Update CockroachDB
if (dbUrl) {
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  async function updateDb() {
    try {
      const client = await pool.connect();
      console.log('Connected to CockroachDB!');

      await client.query(`
        UPDATE products
        SET images = $1
        WHERE id = '1' OR slug = 'bespoke-suit-1' OR name = 'Ice Blue Cape'
      `, [JSON.stringify(updatedImageMap['Ice Blue Cape'])]);

      await client.query(`
        UPDATE products
        SET images = $1
        WHERE id = '12' OR slug = 'bespoke-suit-12' OR name = 'Lavender Drape'
      `, [JSON.stringify(updatedImageMap['Lavender Drape'])]);

      await client.query(`
        UPDATE products
        SET images = $1
        WHERE id = '2' OR slug = 'bespoke-suit-2' OR name = 'Monochrome Drape'
      `, [JSON.stringify(updatedImageMap['Monochrome Drape'])]);

      const res = await client.query(`
        SELECT id, name, images FROM products WHERE id IN ('1', '2', '12')
      `);
      console.log('CockroachDB updated rows:', res.rows);

      client.release();
    } catch (err) {
      console.error('CockroachDB update error:', err.message);
    } finally {
      await pool.end();
    }
  }

  updateDb();
}
