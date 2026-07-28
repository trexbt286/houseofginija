const fs = require('fs');
const path = require('path');

// Parse .env.local manually
const dotenvContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const match = dotenvContent.match(/DATABASE_URL\s*=\s*(.+)/);
const databaseUrl = match ? match[1].trim().replace(/['"]/g, '') : null;

if (!databaseUrl) {
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, name, images, variants FROM products LIMIT 5");
    res.rows.forEach(p => {
      console.log(`Product ID: ${p.id}, Name: ${p.name}`);
      console.log(`- images type: ${typeof p.images}, isArray: ${Array.isArray(p.images)}`);
      console.log(`- images raw:`, p.images);
      console.log(`- variants type: ${typeof p.variants}, isArray: ${Array.isArray(p.variants)}`);
      console.log(`- variants raw:`, p.variants);
      console.log('---');
    });
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
