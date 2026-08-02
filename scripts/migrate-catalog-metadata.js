const fs = require('fs');
const path = require('path');
const { loadEnvConfig } = require('@next/env');
const { Pool } = require('pg');

loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.DATABASE_URL) {
    if (process.argv.includes('--if-configured')) {
      console.log('Skipping catalog metadata migration because DATABASE_URL is not configured.');
      return;
    }

    throw new Error('DATABASE_URL is required to run the catalog metadata migration.');
  }

  const sqlPath = path.join(
    process.cwd(),
    'scripts',
    'migrations',
    '20260802_catalog_categories_and_tags.sql'
  );
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    await pool.query(sql);
    console.log('Catalog categories, on-sale metadata, and tags migrated successfully.');
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Catalog metadata migration failed:', error);
  process.exitCode = 1;
});
