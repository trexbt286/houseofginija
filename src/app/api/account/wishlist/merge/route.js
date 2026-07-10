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

    const { guestWishlist } = await request.json();
    
    if (guestWishlist && Array.isArray(guestWishlist) && guestWishlist.length > 0) {
      // Begin transaction to insert missing items
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        for (const productId of guestWishlist) {
          // Check if it already exists
          const checkResult = await client.query(
            'SELECT 1 FROM wishlist WHERE user_id = $1 AND product_id = $2',
            [decoded.id, productId]
          );
          
          if (checkResult.rows.length === 0) {
            await client.query(
              'INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)',
              [decoded.id, productId]
            );
          }
        }
        
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }

    // Return the updated merged wishlist IDs
    const result = await pool.query(
      'SELECT product_id FROM wishlist WHERE user_id = $1',
      [decoded.id]
    );
    const wishlistIds = result.rows.map(row => row.product_id);

    return NextResponse.json({ wishlist: wishlistIds });
  } catch (error) {
    console.error('Wishlist merge error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
