import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM collections ORDER BY id ASC');
    return NextResponse.json({ collections: result.rows });
  } catch (error) {
    console.error('Fetch collections error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
