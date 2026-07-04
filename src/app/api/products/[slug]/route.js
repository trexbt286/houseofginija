import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request, { params }) {
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
