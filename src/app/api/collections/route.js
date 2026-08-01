import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureCatalogCollections } from '@/lib/catalogCollections';

export const revalidate = 300;

export async function GET() {
  try {
    await ensureCatalogCollections(pool);
    const result = await pool.query('SELECT * FROM collections ORDER BY id ASC');
    return NextResponse.json({ collections: result.rows });
  } catch (error) {
    console.error('Fetch collections error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
