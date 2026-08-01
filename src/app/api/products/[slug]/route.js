import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { shouldUseLocalCatalogFallbackFirst, canUseLocalCatalogFallback, getLocalProductBySlugFallback } from '@/lib/localCatalogFallback';

export async function GET(request, { params }) {
  if (shouldUseLocalCatalogFallbackFirst()) {
    const { slug } = await params;
    const product = getLocalProductBySlugFallback(slug);
    if (product) {
      return NextResponse.json({ product });
    }
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  try {
    const { slug } = await params;

    const queryText = `
      SELECT p.*, c.name as collection_name, c.slug as collection_slug 
      FROM products p 
      LEFT JOIN collections c ON p.collection_id = c.id 
      WHERE p.slug = $1
    `;
    const result = await pool.query(queryText, [slug]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product: result.rows[0] });
  } catch (error) {
    console.error('Fetch product by slug error:', error);
    if (canUseLocalCatalogFallback()) {
      const { slug } = await params;
      const product = getLocalProductBySlugFallback(slug);
      if (product) {
        return NextResponse.json({ product });
      }
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
