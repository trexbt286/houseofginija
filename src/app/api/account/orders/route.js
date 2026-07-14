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

    const orders = result.rows;

    // Fetch product images for order items to display thumbnails
    const allProductIds = [...new Set(orders.flatMap(o => (o.items || []).map(i => i.id)))];
    
    if (allProductIds.length > 0) {
      const prodRes = await pool.query(
        'SELECT id, images FROM products WHERE id = ANY($1)',
        [allProductIds]
      );
      
      const productImagesMap = prodRes.rows.reduce((acc, p) => {
        const images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
        acc[p.id] = Array.isArray(images) && images.length > 0 ? images[0] : null;
        return acc;
      }, {});

      for (const order of orders) {
        if (order.items && Array.isArray(order.items)) {
          for (const item of order.items) {
            if (!item.image) {
              item.image = productImagesMap[item.id] || null;
            }
          }
        }
      }
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch account orders error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
