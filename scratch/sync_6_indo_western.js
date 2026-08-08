const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

// The 6 exact products shown in the user's Admin Portal screenshot for Indo-Western:
const exact6IndoWesternProducts = [
  {
    id: '101',
    name: 'Blush Pink Drape',
    slug: 'blush-pink-drape-2',
    description: 'A graceful blush pink drape set featuring a heavily hand-embellished blouse with intricate sequins, beads, and zari work, paired with a fluid draped skirt and an elegant long shrug.',
    price: '33333',
    collection_id: '8',
    is_out_of_stock: false,
    images: ['/local-products/033-blush-pink-drape-1.jpg', '/local-products/034-blush-pink-drape-2.jpg'],
    variants: [{ color: 'Default', size: 'S', stock: 10 }],
    flash_sale: true,
    flash_sale_price: '26666',
    new_arrival: false,
    collection_name: 'Indo-Western',
    collection_slug: 'indo-western',
    on_sale: true,
    collection_slugs: ['indo-western', 'flash-sale']
  },
  {
    id: '102',
    name: 'Champagne Drape Saree',
    slug: 'champagne-drape-saree-1',
    description: 'Elegant champagne drape saree featuring a hand-embellished blouse and graceful modern silhouette, perfect for weddings and festive celebrations.',
    price: '12343',
    collection_id: '8',
    is_out_of_stock: false,
    images: ['/local-products/037-champagne-drape-saree-1.jpg', '/local-products/038-champagne-drape-saree-2.jpg'],
    variants: [{ color: 'Default', size: 'M', stock: 10 }],
    flash_sale: false,
    flash_sale_price: null,
    new_arrival: false,
    collection_name: 'Indo-Western',
    collection_slug: 'indo-western',
    on_sale: false,
    collection_slugs: ['indo-western']
  },
  {
    id: '103',
    name: 'Chinnon drape skirt with embroidered cape and hand embroidered blouse',
    slug: 'chinnon-drape-skirt-with-embroidered-cape-and-hand-embroidered-blouse',
    description: 'A luxurious Chinnon drape skirt with an intricately hand-embroidered cape and matching blouse.',
    price: '8500',
    collection_id: '8',
    is_out_of_stock: false,
    images: ['/local-products/034-blush-pink-drape-2.jpg'],
    variants: [{ color: 'Default', size: 'M', stock: 10 }],
    flash_sale: false,
    flash_sale_price: null,
    new_arrival: false,
    collection_name: 'Indo-Western',
    collection_slug: 'indo-western',
    on_sale: false,
    collection_slugs: ['indo-western']
  },
  {
    id: '1',
    name: 'Ice Blue Cape',
    slug: 'bespoke-suit-1',
    description: 'A finely tailored bespoke suit, crafted from exceptional textiles with structured shoulders and a modern silhouette.',
    price: '27000',
    collection_id: '8',
    is_out_of_stock: false,
    images: ['/local-products/001-bespoke-suit-1-1.jpg'],
    variants: [{ color: 'Default', size: 'M', stock: 10 }],
    flash_sale: false,
    flash_sale_price: null,
    new_arrival: false,
    collection_name: 'Indo-Western',
    collection_slug: 'indo-western',
    on_sale: false,
    collection_slugs: ['indo-western']
  },
  {
    id: '12',
    name: 'Lavender Drape',
    slug: 'bespoke-suit-12',
    description: 'An elegant lavender draped silhouette with fine hand-worked detailing.',
    price: '34000',
    collection_id: '8',
    is_out_of_stock: false,
    images: ['/local-products/023-bespoke-suit-12-1.jpg'],
    variants: [{ color: 'Default', size: 'M', stock: 10 }],
    flash_sale: false,
    flash_sale_price: null,
    new_arrival: false,
    collection_name: 'Indo-Western',
    collection_slug: 'indo-western',
    on_sale: false,
    collection_slugs: ['indo-western']
  },
  {
    id: '2',
    name: 'Monochrome Drape',
    slug: 'bespoke-suit-2',
    description: 'A striking monochrome drape outfit with a structured jacket overlay.',
    price: '29000',
    collection_id: '8',
    is_out_of_stock: false,
    images: ['/local-products/003-bespoke-suit-2-1.jpg'],
    variants: [{ color: 'Default', size: 'M', stock: 10 }],
    flash_sale: false,
    flash_sale_price: null,
    new_arrival: false,
    collection_name: 'Indo-Western',
    collection_slug: 'indo-western',
    on_sale: false,
    collection_slugs: ['indo-western']
  }
];

// 1. Sync local fallback JSON files
const prodsPath = './src/data/local-products-fallback.json';
const homePath = './src/data/local-homepage-fallback.json';

const prodsData = JSON.parse(fs.readFileSync(prodsPath, 'utf8'));
const homeData = JSON.parse(fs.readFileSync(homePath, 'utf8'));

for (const p of exact6IndoWesternProducts) {
  const idx = prodsData.products.findIndex(item => String(item.id) === String(p.id) || item.slug === p.slug);
  if (idx !== -1) {
    prodsData.products[idx] = { ...prodsData.products[idx], ...p };
  } else {
    prodsData.products.unshift(p);
  }
}

fs.writeFileSync(prodsPath, JSON.stringify(prodsData, null, 2), 'utf8');

homeData.heavyDresses.indoWestern = exact6IndoWesternProducts;
fs.writeFileSync(homePath, JSON.stringify(homeData, null, 2), 'utf8');

console.log('Local fallback JSON files synced with 6 Indo-Western products!');

// 2. Sync CockroachDB
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

      for (const p of exact6IndoWesternProducts) {
        // Upsert into CockroachDB products
        await client.query(`
          INSERT INTO products (id, name, slug, description, price, collection_id, is_out_of_stock, images, variants, flash_sale, flash_sale_price, new_arrival)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            slug = EXCLUDED.slug,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            collection_id = 8,
            images = EXCLUDED.images,
            variants = EXCLUDED.variants,
            flash_sale = EXCLUDED.flash_sale,
            flash_sale_price = EXCLUDED.flash_sale_price,
            new_arrival = EXCLUDED.new_arrival
        `, [
          p.id,
          p.name,
          p.slug,
          p.description,
          p.price,
          8,
          false,
          JSON.stringify(p.images),
          JSON.stringify(p.variants),
          Boolean(p.flash_sale),
          p.flash_sale_price,
          Boolean(p.new_arrival)
        ]);

        // Also update any matching slug in DB
        await client.query(`
          UPDATE products
          SET collection_id = 8
          WHERE LOWER(name) LIKE $1 OR slug LIKE $2
        `, [`%${p.name.slice(0, 10).toLowerCase()}%`, `%${p.slug.slice(0, 10)}%`]);
      }

      const checkRes = await client.query('SELECT id, name, collection_id FROM products WHERE collection_id = 8');
      console.log('CockroachDB Indo-Western rows count after sync:', checkRes.rows.length);
      console.log('CockroachDB Indo-Western rows:', checkRes.rows);

      client.release();
    } catch (err) {
      console.error('CockroachDB update error:', err.message);
    } finally {
      await pool.end();
    }
  }

  updateDb();
}
