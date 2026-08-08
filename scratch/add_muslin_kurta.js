const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

const muslinProduct = {
  id: '201',
  name: 'Muslin kurta and dupatta bottom - santoon',
  slug: 'muslin-kurta-and-dupatta-bottom-santoon',
  description: 'Premium Muslin kurta paired with a soft santoon bottom and an intricately designed matching dupatta. Beautifully crafted for unstitched suit elegance.',
  price: '4500',
  collection_id: '1',
  is_out_of_stock: false,
  images: ['/local-products/001-bespoke-suit-1-1.jpg'],
  variants: [
    { color: 'Default', size: 'S', stock: 10 },
    { color: 'Default', size: 'M', stock: 10 },
    { color: 'Default', size: 'L', stock: 10 },
    { color: 'Default', size: 'XL', stock: 10 },
    { color: 'Default', size: 'XXL', stock: 10 }
  ],
  flash_sale: false,
  flash_sale_price: null,
  new_arrival: true,
  collection_name: 'Unstitched Suits',
  collection_slug: 'suits',
  on_sale: false,
  tags: [{ id: '1', name: 'Unstitched Suits', slug: 'unstitched-suits' }],
  collection_slugs: ['suits', 'new-collection']
};

// 1. Add to local-products-fallback.json
const prodsPath = './src/data/local-products-fallback.json';
const prodsData = JSON.parse(fs.readFileSync(prodsPath, 'utf8'));

const existingIdx = prodsData.products.findIndex(p => p.slug === muslinProduct.slug || p.name.toLowerCase().includes('muslin kurta'));
if (existingIdx !== -1) {
  prodsData.products[existingIdx] = { ...prodsData.products[existingIdx], ...muslinProduct };
} else {
  prodsData.products.unshift(muslinProduct);
}

fs.writeFileSync(prodsPath, JSON.stringify(prodsData, null, 2), 'utf8');
console.log('Muslin kurta product successfully added to local-products-fallback.json!');

// 2. Add to CockroachDB if connected
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
        INSERT INTO products (id, name, slug, description, price, collection_id, is_out_of_stock, images, variants, flash_sale, flash_sale_price, new_arrival)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          collection_id = EXCLUDED.collection_id,
          images = EXCLUDED.images,
          variants = EXCLUDED.variants,
          new_arrival = EXCLUDED.new_arrival
      `, [
        muslinProduct.id,
        muslinProduct.name,
        muslinProduct.slug,
        muslinProduct.description,
        muslinProduct.price,
        1,
        false,
        JSON.stringify(muslinProduct.images),
        JSON.stringify(muslinProduct.variants),
        false,
        null,
        true
      ]);

      console.log('Muslin kurta product successfully inserted into CockroachDB!');
      client.release();
    } catch (err) {
      console.error('CockroachDB insert error:', err.message);
    } finally {
      await pool.end();
    }
  }

  main();
}
