import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET all products and collections lists (for dropdown populating)
export async function GET() {
  try {
    const productsResult = await pool.query(`
      SELECT p.*, c.name as collection_name, c.slug as collection_slug 
      FROM products p 
      LEFT JOIN collections c ON p.collection_id = c.id 
      ORDER BY p.id DESC
    `);

    const collectionsResult = await pool.query('SELECT * FROM collections ORDER BY id ASC');

    return NextResponse.json({
      products: productsResult.rows,
      collections: collectionsResult.rows,
    });
  } catch (error) {
    console.error('Admin GET products error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new product
export async function POST(request) {
  try {
    const {
      name,
      slug,
      description,
      price,
      collection_id,
      is_out_of_stock,
      images,
      variants,
    } = await request.json();

    if (!name || !slug || !price || !images || !variants) {
      return NextResponse.json({ error: 'Missing required product properties' }, { status: 400 });
    }

    const priceNum = parseFloat(price);
    const collectionIdNum = collection_id ? parseInt(collection_id, 10) : null;
    const isOutOfStock = !!is_out_of_stock;

    const result = await pool.query(
      `INSERT INTO products 
       (name, slug, description, price, collection_id, is_out_of_stock, images, variants)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        name.trim(),
        slug.toLowerCase().trim(),
        description || '',
        priceNum,
        collectionIdNum,
        isOutOfStock,
        JSON.stringify(images),
        JSON.stringify(variants),
      ]
    );

    return NextResponse.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Admin POST product error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Product with this URL slug already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update an existing product
export async function PUT(request) {
  try {
    const {
      id,
      name,
      slug,
      description,
      price,
      collection_id,
      is_out_of_stock,
      images,
      variants,
    } = await request.json();

    if (!id || !name || !slug || !price || !images || !variants) {
      return NextResponse.json({ error: 'Missing required product properties for update' }, { status: 400 });
    }

    const priceNum = parseFloat(price);
    const collectionIdNum = collection_id ? parseInt(collection_id, 10) : null;
    const isOutOfStock = !!is_out_of_stock;

    const result = await pool.query(
      `UPDATE products 
       SET name = $1, slug = $2, description = $3, price = $4, collection_id = $5, 
           is_out_of_stock = $6, images = $7, variants = $8
       WHERE id = $9
       RETURNING *`,
      [
        name.trim(),
        slug.toLowerCase().trim(),
        description || '',
        priceNum,
        collectionIdNum,
        isOutOfStock,
        JSON.stringify(images),
        JSON.stringify(variants),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Admin PUT product error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE a product
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Admin DELETE product error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
