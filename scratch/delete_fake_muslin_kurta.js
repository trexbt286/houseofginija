const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

// 1. Remove from local-products-fallback.json
const prodsPath = './src/data/local-products-fallback.json';
const homePath = './src/data/local-homepage-fallback.json';

const prodsData = JSON.parse(fs.readFileSync(prodsPath, 'utf8'));
const homeData = JSON.parse(fs.readFileSync(homePath, 'utf8'));

const initialCount = prodsData.products.length;
prodsData.products = prodsData.products.filter(p => {
  if (p.id === '201') return false;
  if (p.slug === 'muslin-kurta-and-dupatta-bottom-santoon') return false;
  if ((p.name || '').toLowerCase().includes('muslin kurta and dupatta bottom')) return false;
  return true;
});

fs.writeFileSync(prodsPath, JSON.stringify(prodsData, null, 2), 'utf8');
console.log('Removed fake Muslin product from local-products-fallback.json! Count before:', initialCount, 'after:', prodsData.products.length);

// 2. Remove from local-homepage-fallback.json if present
if (homeData.heavyDresses) {
  for (const key of Object.keys(homeData.heavyDresses)) {
    if (Array.isArray(homeData.heavyDresses[key])) {
      homeData.heavyDresses[key] = homeData.heavyDresses[key].filter(p => {
        if (p.id === '201') return false;
        if (p.slug === 'muslin-kurta-and-dupatta-bottom-santoon') return false;
        if ((p.name || '').toLowerCase().includes('muslin kurta and dupatta bottom')) return false;
        return true;
      });
    }
  }
}
fs.writeFileSync(homePath, JSON.stringify(homeData, null, 2), 'utf8');
console.log('Removed fake Muslin product from local-homepage-fallback.json!');

// 3. Delete from CockroachDB
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

      const delRes = await client.query(`
        DELETE FROM products
        WHERE id = '201'
           OR slug = 'muslin-kurta-and-dupatta-bottom-santoon'
           OR LOWER(name) LIKE '%muslin kurta and dupatta bottom%'
      `);

      console.log('Deleted fake Muslin product rows from CockroachDB:', delRes.rowCount);
      client.release();
    } catch (err) {
      console.error('CockroachDB delete error:', err.message);
    } finally {
      await pool.end();
    }
  }

  main();
}
