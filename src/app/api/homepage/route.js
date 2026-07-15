import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const revalidate = 300;

export async function GET() {
  try {
    // 1. Fetch collections
    const collectionsQuery = 'SELECT * FROM collections ORDER BY id ASC';
    
    // 2. Fetch products (we'll filter for flash sale client side or just return all for caching, but since it's just flash products we need for homepage, we can fetch all or just flash)
    // Actually, homepage only displays flash products on the top level. We can query just flash products to save bandwidth.
    const flashProductsQuery = `
      SELECT p.*, c.name as collection_name, c.slug as collection_slug 
      FROM products p 
      LEFT JOIN collections c ON p.collection_id = c.id 
      WHERE p.flash_sale = true
      ORDER BY p.id DESC
    `;

    // 3. Fetch settings
    const settingsQuery = "SELECT value FROM settings WHERE key = 'flash_sale_enabled'";

    const [collectionsResult, flashProductsResult, settingsResult] = await Promise.all([
      pool.query(collectionsQuery),
      pool.query(flashProductsQuery),
      pool.query(settingsQuery)
    ]);

    const flash_sale_enabled = settingsResult.rows.length > 0 ? settingsResult.rows[0].value === 'true' : false;

    return NextResponse.json({ 
      collections: collectionsResult.rows,
      flashProducts: flashProductsResult.rows,
      flash_sale_enabled 
    });
  } catch (error) {
    console.error('Fetch homepage data error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
