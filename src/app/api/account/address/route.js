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

    // Retrieve saved addresses from database
    const result = await pool.query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY id DESC',
      [decoded.id]
    );

    return NextResponse.json({ addresses: result.rows });
  } catch (error) {
    console.error('Fetch address error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
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

    const { type, line1, line2, city, state, postal_code, phone } = await request.json();

    if (!line1 || !city || !state || !postal_code || !phone) {
      return NextResponse.json({ error: 'Missing required address fields' }, { status: 400 });
    }

    // Insert new address
    const result = await pool.query(
      `INSERT INTO addresses (user_id, type, line1, line2, city, state, postal_code, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [decoded.id, type || 'shipping', line1, line2 || '', city, state, postal_code, phone]
    );

    return NextResponse.json({ address: result.rows[0] });
  } catch (error) {
    console.error('Save address error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
