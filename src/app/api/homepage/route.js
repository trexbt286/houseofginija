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

    // 2.5. Fetch new arrivals products
    const newArrivalsQuery = `
      SELECT p.*, c.name as collection_name, c.slug as collection_slug 
      FROM products p 
      LEFT JOIN collections c ON p.collection_id = c.id 
      WHERE p.new_arrival = true
      ORDER BY SUBSTRING(p.name FROM '^[^0-9]+') ASC, COALESCE(NULLIF(SUBSTRING(p.name FROM '[0-9]+'), ''), '0')::integer ASC, p.name ASC
    `;

    // 3. Fetch settings
    const settingsQuery = "SELECT key, value FROM settings WHERE key IN ('flash_sale_enabled', 'new_arrivals_enabled')";

    // 4. Fetch hero reels
    const heroReelsQuery = 'SELECT * FROM hero_reels ORDER BY sort_order ASC, id ASC';

    const [collectionsResult, flashProductsResult, newArrivalsResult, settingsResult, heroReelsResult] = await Promise.all([
      pool.query(collectionsQuery),
      pool.query(flashProductsQuery),
      pool.query(newArrivalsQuery),
      pool.query(settingsQuery),
      pool.query(heroReelsQuery)
    ]);

    const flash_sale_enabled = settingsResult.rows.find(r => r.key === 'flash_sale_enabled')?.value === 'true';
    const new_arrivals_enabled = settingsResult.rows.find(r => r.key === 'new_arrivals_enabled')?.value === 'true';

    const mapProductData = p => {
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
    };

    const flashProducts = flashProductsResult.rows.map(mapProductData);
    const newArrivalProducts = newArrivalsResult.rows.map(mapProductData);

    return NextResponse.json({ 
      collections: collectionsResult.rows,
      flashProducts,
      flash_sale_enabled,
      newArrivalProducts,
      new_arrivals_enabled,
      heroReels: heroReelsResult.rows || []
    });
  } catch (error) {
    console.error('Fetch homepage data error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
