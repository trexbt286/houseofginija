const { Pool } = require('pg');
const path = require('path');
const { loadEnvConfig } = require('@next/env');

loadEnvConfig(process.cwd());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function removeCollections() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Removing old collections and their products...');
    
    // Find the collection IDs first (Including Éclat just in case you want all 4 gone)
    const res = await client.query(`
      SELECT id, name FROM collections 
      WHERE name IN ('Atelier Edit', 'Lumière', 'Noirée', 'Éclat')
    `);
    
    const collectionIds = res.rows.map(r => r.id);
    
    if (collectionIds.length > 0) {
      // Delete products belonging to these collections first
      await client.query(`
        DELETE FROM products WHERE collection_id = ANY($1::int[])
      `, [collectionIds]);
      
      // Delete the collections
      await client.query(`
        DELETE FROM collections WHERE id = ANY($1::int[])
      `, [collectionIds]);
      
      console.log(`Successfully removed ${res.rows.length} old collections and their products.`);
    } else {
      console.log('No matching collections found to remove.');
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error removing collections:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

removeCollections();
