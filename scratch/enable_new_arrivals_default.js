const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  console.log('Enabling new arrivals and tagging latest 4 products...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Set global setting to true
    await client.query(`
      UPDATE settings SET value = 'true' WHERE key = 'new_arrivals_enabled'
    `);
    await client.query(`
      INSERT INTO settings (key, value) 
      SELECT 'new_arrivals_enabled', 'true'
      WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key = 'new_arrivals_enabled')
    `);
    console.log('Global setting new_arrivals_enabled set to true.');

    // 2. Mark the 4 latest products as new arrivals
    await client.query(`
      UPDATE products 
      SET new_arrival = true 
      WHERE id IN (
        SELECT id FROM products 
        ORDER BY id DESC 
        LIMIT 4
      )
    `);
    console.log('Tagged 4 latest products as new arrivals.');

    await client.query('COMMIT');
    console.log('Operation completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Operation failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
