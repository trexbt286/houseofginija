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
  getLocalProductBySlugFallback,
} from '@/lib/localCatalogFallback';

export async function GET(request, { params }) {
  const { slug } = await params;

  if (shouldUseLocalCatalogFallbackFirst()) {
    const product = getLocalProductBySlugFallback(slug);
    if (product) return NextResponse.json({ product: mapProductData(product) });
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  try {
    const result = await pool.query(
      `
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        ${PRODUCT_COLLECTION_JOINS}
        WHERE p.slug = $1
      `,
      [slug]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: mapProductData(result.rows[0]) });
  } catch (error) {
    console.error('Fetch product by slug error:', error);
    if (canUseLocalCatalogFallback()) {
      const product = getLocalProductBySlugFallback(slug);
      if (product) return NextResponse.json({ product: mapProductData(product) });
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
