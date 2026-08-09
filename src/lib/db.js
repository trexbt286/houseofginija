import { Pool } from 'pg';

const useSsl = process.env.DATABASE_URL && 
  !process.env.DATABASE_URL.includes('localhost') && 
  !process.env.DATABASE_URL.includes('127.0.0.1');

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 5000,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
};

let pool;

if (process.env.NODE_ENV === 'production') {
  pool = new Pool(poolConfig);
} else {
  if (!global.dbPool) {
    global.dbPool = new Pool(poolConfig);
  }
  pool = global.dbPool;
}

export default pool;
