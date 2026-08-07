import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  PRODUCT_COLLECTION_JOINS,
  PRODUCT_SELECT_FIELDS,
  mapProductData,
} from '@/lib/catalogMetadata';
import {
  shouldUseLocalCatalogFallbackFirst,
  canUseLocalCatalogFallback,
  getLocalHomepageFallback,
} from '@/lib/localCatalogFallback';

export const revalidate = 300;

export async function GET() {
  if (shouldUseLocalCatalogFallbackFirst()) {
    return NextResponse.json(getLocalHomepageFallback());
  }

  try {
    const collectionsQuery = `
      SELECT
        c.*,
        parent.name AS parent_name,
        parent.slug AS parent_slug
      FROM collections c
      LEFT JOIN collections parent ON parent.id = c.parent_id
      WHERE c.is_active = TRUE
      ORDER BY
        COALESCE(parent.sort_order, c.sort_order) ASC,
        COALESCE(parent.id, c.id) ASC,
        CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END ASC,
        c.sort_order ASC,
        c.name ASC
    `;

    const flashProductsQuery = `
      SELECT ${PRODUCT_SELECT_FIELDS}
      FROM products p
      ${PRODUCT_COLLECTION_JOINS}
      WHERE p.flash_sale = TRUE
      ORDER BY
        SUBSTRING(p.name FROM '^[^0-9]+') ASC,
        COALESCE(NULLIF(SUBSTRING(p.name FROM '[0-9]+'), ''), '0')::integer ASC,
        p.name ASC
    `;

    const newArrivalsQuery = `
      SELECT ${PRODUCT_SELECT_FIELDS}
      FROM products p
      ${PRODUCT_COLLECTION_JOINS}
      WHERE p.new_arrival = TRUE
      ORDER BY
        SUBSTRING(p.name FROM '^[^0-9]+') ASC,
        COALESCE(NULLIF(SUBSTRING(p.name FROM '[0-9]+'), ''), '0')::integer ASC,
        p.name ASC
    `;

    const heavyDressesQuery = `
      SELECT ${PRODUCT_SELECT_FIELDS}
      FROM products p
      ${PRODUCT_COLLECTION_JOINS}
      WHERE c.slug IN ('indo-western', 'gowns', 'heavy-gown', 'shararas')
      ORDER BY p.id ASC
    `;

    const allProductsQuery = `
      SELECT ${PRODUCT_SELECT_FIELDS}
      FROM products p
      ${PRODUCT_COLLECTION_JOINS}
      WHERE p.is_out_of_stock = FALSE
    `;

    const settingsQuery =
      "SELECT key, value FROM settings WHERE key IN ('flash_sale_enabled', 'new_arrivals_enabled', 'jewellery_enabled')";
    const heroReelsQuery = 'SELECT * FROM hero_reels ORDER BY sort_order ASC, id ASC';
    const founderReelsQuery =
      'SELECT * FROM founder_reels ORDER BY sort_order ASC, id ASC LIMIT 3';

    const [
      collectionsResult,
      flashProductsResult,
      newArrivalsResult,
      settingsResult,
      heroReelsResult,
      founderReelsResult,
      heavyDressesResult,
      allProductsResult,
    ] = await Promise.all([
      pool.query(collectionsQuery),
      pool.query(flashProductsQuery),
      pool.query(newArrivalsQuery),
      pool.query(settingsQuery),
      pool.query(heroReelsQuery),
      pool.query(founderReelsQuery),
      pool.query(heavyDressesQuery),
      pool.query(allProductsQuery),
    ]);

    const flash_sale_enabled =
      settingsResult.rows.find((row) => row.key === 'flash_sale_enabled')?.value !== 'false';
    const new_arrivals_enabled =
      settingsResult.rows.find((row) => row.key === 'new_arrivals_enabled')?.value !== 'false';
    const jewellery_enabled =
      settingsResult.rows.find((row) => row.key === 'jewellery_enabled')?.value !== 'false';

    const flashProducts = flashProductsResult.rows.map(mapProductData);
    const newArrivalProducts = newArrivalsResult.rows.map(mapProductData);
    const heavyDressProducts = heavyDressesResult.rows.map(mapProductData);
    const allProductsMapped = allProductsResult.rows.map(mapProductData);

    const isSuitsCategory = (slug) => slug === 'suits' || slug === 'unstitched';
    const isHeavyCategory = (slug) => ['indo-western', 'gowns', 'heavy-gown', 'shararas'].includes(slug);

    const categoryCounts = {
      discounted_suits: allProductsMapped.filter((p) => Boolean(p.flash_sale) && isSuitsCategory(p.collection_slug)).length,
      discounted_heavy: allProductsMapped.filter((p) => Boolean(p.flash_sale) && isHeavyCategory(p.collection_slug)).length,
      suits: allProductsMapped.filter((p) => isSuitsCategory(p.collection_slug)).length,
      indo_western: allProductsMapped.filter((p) => p.collection_slug === 'indo-western').length,
      gowns: allProductsMapped.filter((p) => p.collection_slug === 'gowns' || p.collection_slug === 'heavy-gown').length,
      shararas: allProductsMapped.filter((p) => p.collection_slug === 'shararas').length,
    };

    const fallbackHeavyDresses = getLocalHomepageFallback().heavyDresses || {};
    const getCategoryProducts = (slugs, fallbackItems = []) => {
      const acceptedSlugs = Array.isArray(slugs) ? slugs : [slugs];
      const matched = heavyDressProducts
        .filter((product) => acceptedSlugs.includes(product.collection_slug))
        .slice(0, 4);
      if (matched.length >= 4) return matched;

      const existingSlugs = new Set(matched.map((product) => product.slug));
      const filled = [...matched];
      for (const fallbackProduct of fallbackItems) {
        if (filled.length >= 4) break;
        if (!existingSlugs.has(fallbackProduct.slug)) {
          filled.push(fallbackProduct);
          existingSlugs.add(fallbackProduct.slug);
        }
      }
      return filled;
    };

    const heavyDresses = {
      indoWestern: getCategoryProducts(
        'indo-western',
        fallbackHeavyDresses.indoWestern || []
      ),
      heavyGown: getCategoryProducts(
        ['gowns', 'heavy-gown'],
        fallbackHeavyDresses.heavyGown || []
      ),
      shararas: getCategoryProducts(
        'shararas',
        fallbackHeavyDresses.shararas || []
      ),
    };

    return NextResponse.json({
      collections: collectionsResult.rows,
      flashProducts,
      flash_sale_enabled,
      newArrivalProducts,
      new_arrivals_enabled,
      jewellery_enabled,
      categoryCounts,
      heroReels: heroReelsResult.rows || [],
      founderReels: founderReelsResult.rows || [],
      heavyDresses,
    });
  } catch (error) {
    console.error('Fetch homepage data error:', error);
    if (canUseLocalCatalogFallback()) {
      return NextResponse.json(getLocalHomepageFallback());
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
