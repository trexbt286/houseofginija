import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ensureCatalogCollections } from '@/lib/catalogCollections';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await ensureCatalogCollections(pool);
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

    const ids = searchParams.get('ids');
    if (ids) {
      const idArray = ids.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (idArray.length > 0) {
        queryText += ` AND p.id = ANY($${paramIndex})`;
        queryParams.push(idArray);
        paramIndex++;
      }
    }

    // Filter by collection slug
    if (collection) {
      if (collection === 'heavy-dresses') {
        queryText += ` AND c.slug = ANY(${paramIndex})`;
        queryParams.push(['heavy-dresses', 'indo-western', 'heavy-gowns', 'shararas']);
      } else {
        queryText += ` AND c.slug = ${paramIndex}`;
        queryParams.push(collection);
      }
      paramIndex++;
    }

    // Filter by text search
    if (search) {
      queryText += ` AND p.name ILIKE $${paramIndex}`;
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
      queryText += " ORDER BY p.flash_sale DESC, SUBSTRING(p.name FROM '^[^0-9]+') ASC, COALESCE(NULLIF(SUBSTRING(p.name FROM '[0-9]+'), ''), '0')::integer ASC, p.name ASC";
    } else {
      // Default: Flash sale products first, then alphabetical by name naturally
      queryText += " ORDER BY p.flash_sale DESC, SUBSTRING(p.name FROM '^[^0-9]+') ASC, COALESCE(NULLIF(SUBSTRING(p.name FROM '[0-9]+'), ''), '0')::integer ASC, p.name ASC";
    }

    const result = await pool.query(queryText, queryParams);

    // Fetch global settings
    const settingsResult = await pool.query("SELECT value FROM settings WHERE key = 'flash_sale_enabled'");
    const flash_sale_enabled = settingsResult.rows.length > 0 ? settingsResult.rows[0].value === 'true' : false;

    const products = result.rows.map(p => {
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
    });

    return NextResponse.json({ 
      products,
      flash_sale_enabled 
    });
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
