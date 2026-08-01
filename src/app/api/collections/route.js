import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { shouldUseLocalCatalogFallbackFirst, canUseLocalCatalogFallback, getLocalCollectionsFallback } from '@/lib/localCatalogFallback';

export const revalidate = 300;

export async function GET() {
  if (shouldUseLocalCatalogFallbackFirst()) {
    return NextResponse.json({ collections: getLocalCollectionsFallback() });
  }

  try {
    const result = await pool.query('SELECT * FROM collections ORDER BY id ASC');
    return NextResponse.json({ collections: result.rows });
  } catch (error) {
    console.error('Fetch collections error:', error);
    if (canUseLocalCatalogFallback()) {
      return NextResponse.json({ collections: getLocalCollectionsFallback() });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
