import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve user orders from Postgres
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC',
      [decoded.id]
    );

    return NextResponse.json({ orders: result.rows });
  } catch (error) {
    console.error('Fetch account orders error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
