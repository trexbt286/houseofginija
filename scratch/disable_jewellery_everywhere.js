const fs = require('fs');
const { Pool } = require('pg');

const envText = fs.readFileSync('.env.local', 'utf8');
const match = envText.match(/DATABASE_URL=([^\r\n]+)/);
const dbUrl = match ? match[1].trim().replace(/^['"]|['"]$/g, '') : null;

// 1. Write to local-settings.json
const settingsPath = './src/data/local-settings.json';
let settings = {};
if (fs.existsSync(settingsPath)) {
  try { settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch {}
}
settings.jewellery_enabled = 'false';
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
console.log('Successfully set jewellery_enabled = false in local-settings.json!');

// 2. Write to CockroachDB settings table
if (dbUrl) {
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  async function main() {
    try {
      const client = await pool.connect();
      console.log('Connected to CockroachDB!');
      await client.query(`
        INSERT INTO settings (key, value)
        VALUES ('jewellery_enabled', 'false')
        ON CONFLICT (key) DO UPDATE SET value = 'false'
      `);
      console.log('CockroachDB settings table updated: jewellery_enabled = false!');
      client.release();
    } catch (err) {
      console.error('CockroachDB settings update error:', err.message);
    } finally {
      await pool.end();
    }
  }

  main();
}
