import { NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

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

    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    // Check if the product is already in the customer's wishlist
    const checkResult = await pool.query(
      'SELECT 1 FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [decoded.id, productId]
    );

    if (checkResult.rows.length > 0) {
      // Toggle off - delete
      await pool.query(
        'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2',
        [decoded.id, productId]
      );
      return NextResponse.json({ active: false });
    } else {
      // Toggle on - insert
      await pool.query(
        'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)',
        [decoded.id, productId]
      );
      return NextResponse.json({ active: true });
    }
  } catch (error) {
    console.error('Wishlist sync error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ wishlist: [] });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ wishlist: [] });
    }

    const { searchParams } = new URL(request.url);
    const details = searchParams.get('details') === 'true';

    if (details) {
      // Return full product details joined with collections info
      const result = await pool.query(
        `SELECT p.*, c.name as collection_name 
         FROM wishlist w 
         JOIN products p ON w.product_id = p.id 
         LEFT JOIN collections c ON p.collection_id = c.id 
         WHERE w.user_id = $1 
         ORDER BY p.id DESC`,
        [decoded.id]
      );
      return NextResponse.json({ wishlist: result.rows });
    } else {
      // Return only product IDs array
      const result = await pool.query(
        'SELECT product_id FROM wishlist WHERE user_id = $1',
        [decoded.id]
      );
      const wishlistIds = result.rows.map(row => row.product_id);
      return NextResponse.json({ wishlist: wishlistIds });
    }
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
