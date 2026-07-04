const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: true } // disabled for local dev
});

async function addJewellery() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Create Jewellery Collection
    console.log('Creating Jewellery collection...');
    const collectionRes = await client.query(`
      INSERT INTO collections (name, slug, description, image_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `, [
      'Jewellery', 
      'jewellery', 
      'Exquisite artisan-crafted jewelry, featuring heirloom-quality necklaces, rings, earrings, and bracelets.', 
      '/images/jewellery/necklace/WhatsApp Image 2026-06-19 at 2.48.31 PM.jpeg' // Use first necklace as cover
    ]);
    
    const collectionId = collectionRes.rows[0].id;

    // 2. Scan directories and inject products
    const categories = ['bracelets', 'earrings', 'necklace', 'rings'];
    const baseDir = path.join(__dirname, '..', 'public', 'images', 'jewellery');
    
    let productCounter = 1;

    for (const category of categories) {
      const catDir = path.join(baseDir, category);
      if (!fs.existsSync(catDir)) continue;

      const files = fs.readdirSync(catDir);
      let itemCounter = 1;

      for (const file of files) {
        if (!file.endsWith('.jpeg') && !file.endsWith('.jpg') && !file.endsWith('.png')) continue;
        
        const imageUrl = `/images/jewellery/${category}/${file}`;
        
        // Make name singular and nice
        let catName = category.charAt(0).toUpperCase() + category.slice(1);
        if (catName === 'Earrings') catName = 'Earring Set';
        if (catName === 'Bracelets') catName = 'Bracelet';
        if (catName === 'Rings') catName = 'Ring';
        
        const name = `Atelier Bespoke ${catName} ${itemCounter}`;
        const slug = `atelier-${category}-${itemCounter}-${productCounter}`;
        
        // Assign demo prices based on category
        let price = 15000;
        if (category === 'necklace') price = 45000;
        if (category === 'bracelets') price = 22000;
        if (category === 'rings') price = 18000;
        if (category === 'earrings') price = 14000;
        
        // Add slight variance to prices
        price = price + (Math.floor(Math.random() * 5) * 1000); 

        await client.query(`
          INSERT INTO products (name, slug, description, price, collection_id, is_out_of_stock, images, variants)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (slug) DO NOTHING
        `, [
          name,
          slug,
          `Hand-crafted ${category} from the exclusive House of Ginija Atelier collection.`,
          price,
          collectionId,
          false,
          JSON.stringify([imageUrl]),
          JSON.stringify([{ size: 'One Size', color: 'Gold', stock: 5 }])
        ]);

        console.log(`Added ${name} to database (₹${price})`);
        itemCounter++;
        productCounter++;
      }
    }

    await client.query('COMMIT');
    console.log('\\nSuccessfully added all 27 Jewellery products!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding jewellery:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

addJewellery();
