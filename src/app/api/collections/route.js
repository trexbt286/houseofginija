import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { buildCategoryTree } from '@/lib/catalogMetadata';
import {
  shouldUseLocalCatalogFallbackFirst,
  canUseLocalCatalogFallback,
  getLocalCollectionsFallback,
  getLocalCategoryTreeFallback,
} from '@/lib/localCatalogFallback';

export const revalidate = 300;

export async function GET() {
  if (shouldUseLocalCatalogFallbackFirst()) {
    return NextResponse.json({
      collections: getLocalCollectionsFallback(),
      categoryTree: getLocalCategoryTreeFallback(),
    });
  }

  try {
    const result = await pool.query(`
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
    `);

    const dbCollections = result.rows;
    const fallbackCollections = getLocalCollectionsFallback();
    const existingSlugs = new Set(dbCollections.map((c) => c.slug));

    const mergedCollections = [
      ...dbCollections,
      ...fallbackCollections.filter((c) => !existingSlugs.has(c.slug)),
    ];

    return NextResponse.json({
      collections: mergedCollections,
      categoryTree: buildCategoryTree(mergedCollections),
    });
  } catch (error) {
    console.error('Fetch collections error:', error);
    if (canUseLocalCatalogFallback()) {
      return NextResponse.json({
        collections: getLocalCollectionsFallback(),
        categoryTree: getLocalCategoryTreeFallback(),
      });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
