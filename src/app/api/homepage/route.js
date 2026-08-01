import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { shouldUseLocalCatalogFallbackFirst, canUseLocalCatalogFallback, getLocalHomepageFallback } from '@/lib/localCatalogFallback';

export const revalidate = 300;

export async function GET() {
  if (shouldUseLocalCatalogFallbackFirst()) {
    return NextResponse.json(getLocalHomepageFallback());
  }

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

    // 6. Ensure heavyDresses collections and products exist in DB
    try {
      const existingColsRes = await pool.query("SELECT slug FROM collections WHERE slug IN ('indo-western', 'heavy-gown', 'shararas');");
      const existingSlugs = new Set(existingColsRes.rows.map(r => r.slug));

      if (!existingSlugs.has('indo-western')) {
        await pool.query("INSERT INTO collections (name, slug, description) VALUES ('Indo Western', 'indo-western', 'Modern fusion wear combining traditional artistry with contemporary silhouettes.');");
      }
      if (!existingSlugs.has('heavy-gown')) {
        await pool.query("INSERT INTO collections (name, slug, description) VALUES ('Heavy Gown', 'heavy-gown', 'Opulent floor-length gowns featuring hand-embroidered details and grand flared drapes.');");
      }
      if (!existingSlugs.has('shararas')) {
        await pool.query("INSERT INTO collections (name, slug, description) VALUES ('Shararas', 'shararas', 'Royally embellished sharara sets with intricate zari and sequin craftsmanship.');");
      }
    } catch (colErr) {
      console.error('Heavy dresses collections seed check error:', colErr);
    }

    const heavyDressesRawQuery = `
      SELECT p.*, c.name as collection_name, c.slug as collection_slug 
      FROM products p 
      LEFT JOIN collections c ON p.collection_id = c.id 
      WHERE c.slug IN ('indo-western', 'heavy-gown', 'shararas')
      ORDER BY p.id ASC
    `;

    const [collectionsResult, flashProductsResult, newArrivalsResult, settingsResult, heroReelsResult, founderReelsResult, heavyDressesRawResult] = await Promise.all([
      pool.query(collectionsQuery),
      pool.query(flashProductsQuery),
      pool.query(newArrivalsQuery),
      pool.query(settingsQuery),
      pool.query(heroReelsQuery),
      pool.query(founderReelsQuery),
      pool.query(heavyDressesRawQuery)
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
    const heavyDressesRawMapped = heavyDressesRawResult.rows.map(mapProductData);

    const fallbackData = getLocalHomepageFallback();
    const fallbackHeavyDresses = fallbackData?.heavyDresses || {};

    const getCategoryProducts = (slug, fallbackItems = []) => {
      const matched = heavyDressesRawMapped.filter(p => p.collection_slug === slug);
      if (matched.length >= 4) return matched.slice(0, 4);

      const existingIds = new Set(matched.map(p => p.id));
      const filled = [...matched];
      for (const fb of fallbackItems) {
        if (filled.length >= 4) break;
        if (!existingIds.has(fb.id)) {
          filled.push(fb);
        }
      }
      return filled.slice(0, 4);
    };

    const heavyDresses = {
      indoWestern: getCategoryProducts('indo-western', fallbackHeavyDresses.indoWestern || []),
      heavyGown: getCategoryProducts('heavy-gown', fallbackHeavyDresses.heavyGown || []),
      shararas: getCategoryProducts('shararas', fallbackHeavyDresses.shararas || [])
    };

    return NextResponse.json({ 
      collections: collectionsResult.rows,
      flashProducts,
      flash_sale_enabled,
      newArrivalProducts,
      new_arrivals_enabled,
      heroReels: heroReelsResult.rows || [],
      founderReels: founderReelsResult?.rows || [],
      heavyDresses
    });
  } catch (error) {
    console.error('Fetch homepage data error:', error);
    if (canUseLocalCatalogFallback()) {
      return NextResponse.json(getLocalHomepageFallback());
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
