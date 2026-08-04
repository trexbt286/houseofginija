const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  console.log('Running migrations for New Arrivals...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Add new_arrival column if it doesn't exist
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS new_arrival BOOLEAN DEFAULT FALSE NOT NULL
    `);
    console.log('Added new_arrival column to products.');

    // Insert default setting for new_arrivals_enabled
    await client.query(`
      INSERT INTO settings (key, value) 
      VALUES ('new_arrivals_enabled', 'false') 
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('Inserted default settings for new_arrivals_enabled.');

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
