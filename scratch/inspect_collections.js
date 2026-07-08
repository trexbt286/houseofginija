const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const dotenvContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const match = dotenvContent.match(/DATABASE_URL\s*=\s*(.+)/);
const databaseUrl = match ? match[1].trim().replace(/['"]/g, '') : null;

const pool = new Pool({
  connectionString: databaseUrl,
});

async function check() {
  try {
    const res = await pool.query('SELECT * FROM collections');
    console.log('Collections:', res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
