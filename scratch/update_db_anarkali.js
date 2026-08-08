const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
if (!match) {
  console.log('No DB URL found');
  process.exit(0);
}

const dbUrl = match[1].trim().replace(/^['"]|['"]$/g, '');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 5000,
});

async function main() {
  try {
    const client = await pool.connect();
    console.log('Connected to CockroachDB!');
    const res = await client.query(`
      UPDATE products
      SET flash_sale = false, flash_sale_price = NULL
      WHERE id = $1 OR LOWER(name) LIKE '%anarkali%'
      RETURNING id, name, flash_sale
    `, ['6']);
    console.log('Successfully updated CockroachDB rows:', res.rows);

    // Delete duplicate products if any exist in DB
    const delRes = await client.query(`
      DELETE FROM products
      WHERE slug IN ('anarkali-flared-sharara', 'aqua-hand-draped-sharara', 'blush-pink-drape-2', 'bespoke-necklace-11')
      RETURNING id, name, slug
    `);
    console.log('Deleted duplicate DB rows:', delRes.rows);

    client.release();
  } catch (err) {
    console.error('CockroachDB update error:', err);
  } finally {
    await pool.end();
  }
}

main();
