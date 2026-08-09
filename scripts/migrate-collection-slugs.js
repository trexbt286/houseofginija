const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Adding collection_slugs column to products table in DB...');
    await pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS collection_slugs JSONB");
    console.log('Column collection_slugs added successfully!');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await pool.end();
  }
}

run();
