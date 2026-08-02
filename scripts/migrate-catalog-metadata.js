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
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 3000
  });

  let timerId;
  const timeout = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error('DB Connection Timeout (3s)')), 3000);
  });

  try {
    await Promise.race([pool.query(sql), timeout]);
    console.log('Catalog categories, on-sale metadata, and tags migrated successfully.');
  } catch (error) {
    console.error('Catalog metadata migration failed:', error.message);
    if (!process.argv.includes('--if-configured')) {
      throw error;
    }
    console.warn('Proceeding with build despite prebuild migration warning.');
  } finally {
    if (timerId) clearTimeout(timerId);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error('Fatal migration script error:', error);
  process.exitCode = 1;
});
