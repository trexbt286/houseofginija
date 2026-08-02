import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import {
  PRODUCT_COLLECTION_JOINS,
  PRODUCT_SELECT_FIELDS,
  mapProductData,
  buildCategoryTree,
  normalizeTagIds,
  replaceProductTags,
  validateCollection,
  validateTagIds,
} from '@/lib/catalogMetadata';
import {
  shouldUseLocalCatalogFallbackFirst,
  canUseLocalCatalogFallback,
  getLocalCategoryTreeFallback,
  getLocalCollectionsFallback,
  getLocalProductsFallback,
  getLocalTagsFallback,
} from '@/lib/localCatalogFallback';

export const dynamic = 'force-dynamic';

const CATEGORY_QUERY = `
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

async function fetchProductById(client, productId) {
  const result = await client.query(
    `
      SELECT ${PRODUCT_SELECT_FIELDS}
      FROM products p
      ${PRODUCT_COLLECTION_JOINS}
      WHERE p.id = $1
    `,
    [productId]
  );
  return result.rows[0] ? mapProductData(result.rows[0]) : null;
}

function parseProductPayload(body) {
  const priceNum = Number.parseFloat(body.price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    const error = new Error('Product price must be a valid positive number.');
    error.status = 400;
    throw error;
  }

  const collectionId = body.collection_id
    ? Number.parseInt(body.collection_id, 10)
    : null;
  if (body.collection_id && !Number.isInteger(collectionId)) {
    const error = new Error('Selected category is invalid.');
    error.status = 400;
    throw error;
  }

  const flashSale = Boolean(body.flash_sale);
  let flashSalePrice = null;
  if (flashSale) {
    flashSalePrice = Number.parseFloat(body.flash_sale_price);
    if (!Number.isFinite(flashSalePrice) || flashSalePrice <= 0) {
      const error = new Error('Flash sale price must be a valid positive number.');
      error.status = 400;
      throw error;
    }
    if (flashSalePrice >= priceNum) {
      const error = new Error('Flash sale price must be less than the original product price.');
      error.status = 400;
      throw error;
    }
  }

  return {
    name: body.name.trim(),
    slug: body.slug.toLowerCase().trim(),
    description: body.description || '',
    price: priceNum,
    collectionId,
    isOutOfStock: Boolean(body.is_out_of_stock),
    images: body.images,
    variants: body.variants,
    flashSale,
    flashSalePrice,
    newArrival: Boolean(body.new_arrival),
    onSale: Boolean(body.on_sale),
  };
}

function validateRequiredProductFields(body, update = false) {
  if (
    (update && !body.id) ||
    !body.name ||
    !body.slug ||
    body.price === undefined ||
    body.price === null ||
    !Array.isArray(body.images) ||
    !Array.isArray(body.variants)
  ) {
    const error = new Error(
      update
        ? 'Missing required product properties for update.'
        : 'Missing required product properties.'
    );
    error.status = 400;
    throw error;
  }
}

export async function GET() {
  if (shouldUseLocalCatalogFallbackFirst()) {
    return NextResponse.json({
      products: getLocalProductsFallback(),
      collections: getLocalCollectionsFallback(),
      categoryTree: getLocalCategoryTreeFallback(),
      tags: getLocalTagsFallback(),
    });
  }

  try {
    const [productsResult, collectionsResult, tagsResult] = await Promise.all([
      pool.query(`
        SELECT ${PRODUCT_SELECT_FIELDS}
        FROM products p
        ${PRODUCT_COLLECTION_JOINS}
        ORDER BY p.id DESC
      `),
      pool.query(CATEGORY_QUERY),
      pool.query('SELECT id, name, slug FROM tags ORDER BY name ASC'),
    ]);

    return NextResponse.json({
      products: productsResult.rows.map(mapProductData),
      collections: collectionsResult.rows,
      categoryTree: buildCategoryTree(collectionsResult.rows),
      tags: tagsResult.rows,
    });
  } catch (error) {
    console.error('Admin GET products error:', error);
    if (canUseLocalCatalogFallback()) {
      return NextResponse.json({
        products: getLocalProductsFallback(),
        collections: getLocalCollectionsFallback(),
        categoryTree: getLocalCategoryTreeFallback(),
        tags: getLocalTagsFallback(),
      });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    validateRequiredProductFields(body);
    const product = parseProductPayload(body);
    const tagIds = normalizeTagIds(body);

    await client.query('BEGIN');
    await validateCollection(client, product.collectionId);
    await validateTagIds(client, tagIds);

    const result = await client.query(
      `
        INSERT INTO products (
          name, slug, description, price, collection_id, is_out_of_stock,
          images, variants, flash_sale, flash_sale_price, new_arrival, on_sale
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `,
      [
        product.name,
        product.slug,
        product.description,
        product.price,
        product.collectionId,
        product.isOutOfStock,
        JSON.stringify(product.images),
        JSON.stringify(product.variants),
        product.flashSale,
        product.flashSalePrice,
        product.newArrival,
        product.onSale,
      ]
    );

    const productId = result.rows[0].id;
    await replaceProductTags(client, productId, tagIds);
    const savedProduct = await fetchProductById(client, productId);
    await client.query('COMMIT');

    return NextResponse.json({ success: true, product: savedProduct });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin POST product error:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Product with this URL slug already exists.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.status === 400 ? error.message : 'Internal Server Error' },
      { status: error.status || 500 }
    );
  } finally {
    client.release();
  }
}

export async function PUT(request) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    validateRequiredProductFields(body, true);
    const product = parseProductPayload(body);
    const shouldReplaceTags =
      Object.prototype.hasOwnProperty.call(body, 'tag_ids') ||
      Object.prototype.hasOwnProperty.call(body, 'tags');
    const tagIds = shouldReplaceTags ? normalizeTagIds(body) : null;

    await client.query('BEGIN');
    await validateCollection(client, product.collectionId);
    if (tagIds) await validateTagIds(client, tagIds);

    const result = await client.query(
      `
        UPDATE products
        SET
          name = $1,
          slug = $2,
          description = $3,
          price = $4,
          collection_id = $5,
          is_out_of_stock = $6,
          images = $7,
          variants = $8,
          flash_sale = $9,
          flash_sale_price = $10,
          new_arrival = $11,
          on_sale = $12
        WHERE id = $13
        RETURNING id
      `,
      [
        product.name,
        product.slug,
        product.description,
        product.price,
        product.collectionId,
        product.isOutOfStock,
        JSON.stringify(product.images),
        JSON.stringify(product.variants),
        product.flashSale,
        product.flashSalePrice,
        product.newArrival,
        product.onSale,
        body.id,
      ]
    );

    if (result.rows.length === 0) {
      const error = new Error('Product not found.');
      error.status = 404;
      throw error;
    }

    if (tagIds) await replaceProductTags(client, body.id, tagIds);
    const savedProduct = await fetchProductById(client, body.id);
    await client.query('COMMIT');

    return NextResponse.json({ success: true, product: savedProduct });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin PUT product error:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Product with this URL slug already exists.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.status ? error.message : 'Internal Server Error' },
      { status: error.status || 500 }
    );
  } finally {
    client.release();
  }
}

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
