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

    // 5. Fetch founder reels (ensuring table exists)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS founder_reels (
          id SERIAL PRIMARY KEY,
          video_url TEXT NOT NULL,
          title VARCHAR(255) DEFAULT 'Founder Reel',
          sort_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      const countRes = await pool.query('SELECT COUNT(*) as count FROM founder_reels;');
      if (parseInt(countRes.rows[0].count, 10) === 0) {
        await pool.query(`
          INSERT INTO founder_reels (video_url, title, sort_order) VALUES
          ('/videos/hero_reels/reel_1.mp4', 'Founder Reel 1', 1),
          ('/videos/hero_reels/reel_2.mp4', 'Founder Reel 2', 2),
          ('/videos/hero_reels/reel_3.mp4', 'Founder Reel 3', 3);
        `);
      }
    } catch (tblErr) {
      console.error('Founder reels table check error:', tblErr);
    }

    const founderReelsQuery = 'SELECT * FROM founder_reels ORDER BY sort_order ASC, id ASC LIMIT 3';

    const heavyDressProductIds = ['1197284660957085697', '1197284433367531521', '1197284438722019329', '1197283535333523457'];
    const heavyDressProductsQuery = `
      SELECT p.*, c.name as collection_name, c.slug as collection_slug
      FROM products p
      LEFT JOIN collections c ON p.collection_id = c.id
      WHERE p.id::text = ANY($1::text[])
      ORDER BY array_position($1::text[], p.id::text)
    `;

    const [collectionsResult, flashProductsResult, newArrivalsResult, settingsResult, heroReelsResult, founderReelsResult, heavyDressProductsResult] = await Promise.all([
      pool.query(collectionsQuery),
      pool.query(flashProductsQuery),
      pool.query(newArrivalsQuery),
      pool.query(settingsQuery),
      pool.query(heroReelsQuery),
      pool.query(founderReelsQuery),
      pool.query(heavyDressProductsQuery, [heavyDressProductIds])
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
    const heavyDressProducts = heavyDressProductsResult.rows.map(mapProductData);

    return NextResponse.json({ 
      collections: collectionsResult.rows,
      flashProducts,
      flash_sale_enabled,
      newArrivalProducts,
      new_arrivals_enabled,
      heroReels: heroReelsResult.rows || [],
      founderReels: founderReelsResult?.rows || [],
      heavyDressProducts
    });
  } catch (error) {
    console.error('Fetch homepage data error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
