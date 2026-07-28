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
      ORDER BY SUBSTRING(p.name FROM '^[^0-9]+') ASC, COALESCE(NULLIF(SUBSTRING(p.name FROM '[0-9]+'), ''), '0')::integer ASC, p.name ASC
    `;

    // 3. Fetch settings
    const settingsQuery = "SELECT value FROM settings WHERE key = 'flash_sale_enabled'";

    // 4. Fetch hero reels
    const heroReelsQuery = 'SELECT * FROM hero_reels ORDER BY sort_order ASC, id ASC';

    const [collectionsResult, flashProductsResult, settingsResult, heroReelsResult] = await Promise.all([
      pool.query(collectionsQuery),
      pool.query(flashProductsQuery),
      pool.query(settingsQuery),
      pool.query(heroReelsQuery)
    ]);

    const flash_sale_enabled = settingsResult.rows.length > 0 ? settingsResult.rows[0].value === 'true' : false;

    const flashProducts = flashProductsResult.rows.map(p => {
      let images = p.images;
      if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch (e) {}
      }
      let variants = p.variants;
      if (typeof variants === 'string') {
        try { variants = JSON.parse(variants); } catch (e) {}
      }
      return {
        ...p,
        images: Array.isArray(images) ? images : [],
        variants: Array.isArray(variants) ? variants : [],
      };
    });

    return NextResponse.json({ 
      collections: collectionsResult.rows,
      flashProducts,
      flash_sale_enabled,
      heroReels: heroReelsResult.rows || []
    });
  } catch (error) {
    console.error('Fetch homepage data error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
