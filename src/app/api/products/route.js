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
  getLocalProductsResponseFallback,
} from '@/lib/localCatalogFallback';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (shouldUseLocalCatalogFallbackFirst()) {
    const response = getLocalProductsResponseFallback();
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection') || searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const ids = searchParams.get('ids');
    const sort = searchParams.get('sort');

    let products = [...response.products];

    if (ids) {
      const selectedIds = new Set(ids.split(',').map(String));
      products = products.filter((product) => selectedIds.has(String(product.id)));
    }
    if (collection) {
      products = products.filter((product) =>
        product.collection_slug === collection ||
        product.parent_collection_slug === collection ||
        (collection === 'new-collection' && product.new_arrival) ||
        (collection === 'flash-sale' && (product.on_sale || product.flash_sale))
      );
    }
    if (tag) {
      products = products.filter((product) =>
        (product.tags || []).some((productTag) => productTag.slug === tag)
      );
    }
    if (search) {
      const term = search.toLowerCase();
      products = products.filter((product) => product.name.toLowerCase().includes(term));
    }

    products.sort((a, b) => {
      const saleDelta = Number(Boolean(b.on_sale)) - Number(Boolean(a.on_sale));
      if (saleDelta) return saleDelta;
      const flashDelta = Number(Boolean(b.flash_sale)) - Number(Boolean(a.flash_sale));
      if (flashDelta) return flashDelta;
      if (sort === 'price_asc') return Number(a.price) - Number(b.price);
      if (sort === 'price_desc') return Number(b.price) - Number(a.price);
      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });

    return NextResponse.json({ ...response, products });
  }

  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection') || searchParams.get('category');
    const search = searchParams.get('search');
    const size = searchParams.get('size');
    const color = searchParams.get('color');
    const tag = searchParams.get('tag');
    const sort = searchParams.get('sort');

    let queryText = `
      SELECT ${PRODUCT_SELECT_FIELDS}
      FROM products p
      ${PRODUCT_COLLECTION_JOINS}
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    const ids = searchParams.get('ids');
    if (ids) {
      const idArray = ids.split(',').map((id) => Number.parseInt(id, 10)).filter(Number.isInteger);
      if (idArray.length > 0) {
        queryText += ` AND p.id = ANY($${paramIndex}::int[])`;
        queryParams.push(idArray);
        paramIndex += 1;
      }
    }

    if (collection) {
      queryText += ` AND (
        c.slug = $${paramIndex}
        OR parent_c.slug = $${paramIndex}
        OR ($${paramIndex} = 'gowns' AND c.slug = 'heavy-gown')
        OR ($${paramIndex} = 'new-collection' AND p.new_arrival = TRUE)
        OR ($${paramIndex} = 'flash-sale' AND (p.on_sale = TRUE OR p.flash_sale = TRUE))
      )`;
      queryParams.push(collection);
      paramIndex += 1;
    }

    if (tag) {
      queryText += ` AND EXISTS (
        SELECT 1
        FROM product_tags filter_pt
        INNER JOIN tags filter_tag ON filter_tag.id = filter_pt.tag_id
        WHERE filter_pt.product_id = p.id AND filter_tag.slug = $${paramIndex}
      )`;
      queryParams.push(tag);
      paramIndex += 1;
    }

    if (search) {
      queryText += ` AND p.name ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex += 1;
    }

    if (size) {
      queryText += ` AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.variants) AS v(size TEXT, stock INT)
        WHERE v.size = $${paramIndex} AND v.stock > 0
      )`;
      queryParams.push(size);
      paramIndex += 1;
    }

    if (color) {
      queryText += ` AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.variants) AS v(color TEXT, stock INT)
        WHERE v.color = $${paramIndex} AND v.stock > 0
      )`;
      queryParams.push(color);
      paramIndex += 1;
    }

    const naturalNameSort = `SUBSTRING(p.name FROM '^[^0-9]+') ASC,
      COALESCE(NULLIF(SUBSTRING(p.name FROM '[0-9]+'), ''), '0')::integer ASC,
      p.name ASC`;

    if (sort === 'price_asc') {
      queryText += ' ORDER BY p.on_sale DESC, p.price ASC, p.flash_sale DESC, p.id ASC';
    } else if (sort === 'price_desc') {
      queryText += ' ORDER BY p.on_sale DESC, p.price DESC, p.flash_sale DESC, p.id ASC';
    } else {
      queryText += ` ORDER BY p.on_sale DESC, p.flash_sale DESC, ${naturalNameSort}`;
    }

    const result = await pool.query(queryText, queryParams);
    const settingsResult = await pool.query(
      "SELECT value FROM settings WHERE key = 'flash_sale_enabled'"
    );
    const flash_sale_enabled =
      settingsResult.rows.length > 0 && settingsResult.rows[0].value === 'true';

    const dbProducts = result.rows.map(mapProductData);
    const fallbackProducts = getLocalProductsFallback();
    const dbSlugs = new Set(dbProducts.map((p) => p.slug));

    let matchingFallback = fallbackProducts.filter((p) => !dbSlugs.has(p.slug));
    if (collection) {
      matchingFallback = matchingFallback.filter((p) =>
        p.collection_slug === collection ||
        p.parent_collection_slug === collection ||
        (collection === 'new-collection' && p.new_arrival) ||
        (collection === 'flash-sale' && (p.on_sale || p.flash_sale))
      );
    }
    if (tag) {
      matchingFallback = matchingFallback.filter((p) =>
        (p.tags || []).some((productTag) => productTag.slug === tag)
      );
    }
    if (search) {
      const term = search.toLowerCase();
      matchingFallback = matchingFallback.filter((p) => p.name.toLowerCase().includes(term));
    }

    const finalProducts = [...dbProducts, ...matchingFallback];

    return NextResponse.json({
      products: finalProducts,
      flash_sale_enabled,
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    if (canUseLocalCatalogFallback()) {
      return NextResponse.json(getLocalProductsResponseFallback());
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
