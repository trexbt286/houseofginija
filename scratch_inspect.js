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
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, name, slug, variants FROM products WHERE name IN ('Bespoke Suit 33', 'Bespoke Suit 32')");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
