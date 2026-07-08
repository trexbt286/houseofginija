const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('Running migrations...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Add flash_sale column if it doesn't exist
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS flash_sale BOOLEAN DEFAULT FALSE NOT NULL
    `);
    console.log('Added flash_sale column to products.');

    // Add flash_sale_price column if it doesn't exist
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS flash_sale_price DECIMAL(10, 2)
    `);
    console.log('Added flash_sale_price column to products.');

    // Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value VARCHAR(255) NOT NULL
      )
    `);
    console.log('Created settings table.');

    // Insert default setting for flash_sale_enabled
    await client.query(`
      INSERT INTO settings (key, value) 
      VALUES ('flash_sale_enabled', 'false') 
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('Inserted default settings.');

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
