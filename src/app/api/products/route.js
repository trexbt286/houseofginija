import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get('collection');
    const search = searchParams.get('search');
    const size = searchParams.get('size');
    const color = searchParams.get('color');
    const sort = searchParams.get('sort');

    let queryText = `
      SELECT p.*, c.name as collection_name, c.slug as collection_slug 
      FROM products p 
      LEFT JOIN collections c ON p.collection_id = c.id 
      WHERE 1=1
    `;
    const queryParams = [];
    let paramIndex = 1;

    // Filter by collection slug
    if (collection) {
      queryText += ` AND c.slug = $${paramIndex}`;
      queryParams.push(collection);
      paramIndex++;
    }

    // Filter by text search
    if (search) {
      queryText += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Filter by variant size availability using Postgres jsonb query
    if (size) {
      queryText += ` AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.variants) AS v(size TEXT, stock INT) 
        WHERE v.size = $${paramIndex} AND v.stock > 0
      )`;
      queryParams.push(size);
      paramIndex++;
    }

    // Filter by variant color availability using Postgres jsonb query
    if (color) {
      queryText += ` AND EXISTS (
        SELECT 1 FROM jsonb_to_recordset(p.variants) AS v(color TEXT, stock INT) 
        WHERE v.color = $${paramIndex} AND v.stock > 0
      )`;
      queryParams.push(color);
      paramIndex++;
    }

    // Sorting options
    if (sort === 'price_asc') {
      queryText += ' ORDER BY p.price ASC';
    } else if (sort === 'price_desc') {
      queryText += ' ORDER BY p.price DESC';
    } else if (sort === 'name_asc') {
      queryText += ' ORDER BY p.name ASC';
    } else {
      // Default: Newest/ID desc
      queryText += ' ORDER BY p.id DESC';
    }

    const result = await pool.query(queryText, queryParams);

    return NextResponse.json({ products: result.rows });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
