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
  getLocalCategoryTreeFallback,
  getLocalCollectionsFallback,
  getLocalTagsFallback,
} from '@/lib/localCatalogFallback';
import {
  getStore,
  upsertProduct,
  removeProduct,
} from '@/lib/globalProductStore';

export const dynamic = 'force-dynamic';

function getStoreProducts() {
  return getStore();
}

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

  const collectionSlugs = Array.isArray(body.collection_slugs) ? body.collection_slugs : [];

  const flashSale = collectionSlugs.includes('flash-sale') || Boolean(body.flash_sale);
  let flashSalePrice = null;
  if (flashSale) {
    flashSalePrice = body.flash_sale_price ? Number.parseFloat(body.flash_sale_price) : priceNum * 0.8;
  }

  return {
    name: body.name.trim(),
    slug: body.slug.toLowerCase().trim(),
    description: body.description || '',
    price: priceNum,
    collectionId,
    collectionSlugs,
    isOutOfStock: Boolean(body.is_out_of_stock),
    images: body.images,
    variants: body.variants,
    tags: Array.isArray(body.tags) ? body.tags : [],
    flashSale,
    flashSalePrice,
    newArrival: collectionSlugs.includes('new-collection') || Boolean(body.new_arrival),
    onSale: collectionSlugs.includes('flash-sale') || Boolean(body.on_sale),
  };
}

function normalizeLocalProductTags(body, availableTags = getLocalTagsFallback()) {
  const selectedTagIds = normalizeTagIds(body);
  const selectedTags = availableTags.filter((tag) => selectedTagIds.includes(Number(tag.id)));
  const customTags = Array.isArray(body.tags) ? body.tags : [];

  return [...selectedTags, ...customTags];
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
      products: getStoreProducts(),
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
    return NextResponse.json({
      products: getStoreProducts(),
      collections: getLocalCollectionsFallback(),
      categoryTree: getLocalCategoryTreeFallback(),
      tags: getLocalTagsFallback(),
    });
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
    validateRequiredProductFields(body);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Invalid product payload' }, { status: 400 });
  }

  const product = parseProductPayload(body);

  if (shouldUseLocalCatalogFallbackFirst()) {
    const store = getStoreProducts();
    const newId = Date.now();
    const newProduct = mapProductData({
      id: newId,
      ...product,
      collection_id: product.collectionId || 1,
      collection_slugs: product.collectionSlugs,
      collection_slug: product.collectionSlugs[0] || 'suits',
      collection_name: product.collectionSlugs[0] || 'Unstitched Suits',
      tags: normalizeLocalProductTags(body),
    });
    store.unshift(newProduct);
    return NextResponse.json({ success: true, product: newProduct });
  }

  let client;
  try {
    client = await pool.connect();
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
    await replaceProductTags(client, productId, [...(tagIds || []), ...(product.tags || [])]);
    const savedProduct = await fetchProductById(client, productId);
    await client.query('COMMIT');

    return NextResponse.json({ success: true, product: savedProduct });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Admin POST product error:', error);
    const store = getStoreProducts();
    const newId = Date.now();
    const newProduct = mapProductData({
      id: newId,
      ...product,
      collection_id: product.collectionId || 1,
      collection_slugs: product.collectionSlugs,
      collection_slug: product.collectionSlugs[0] || 'suits',
      collection_name: product.collectionSlugs[0] || 'Unstitched Suits',
      tags: Array.isArray(product.tags) ? product.tags : [],
    });
    upsertProduct(newProduct);
    return NextResponse.json({ success: true, product: newProduct });
  } finally {
    if (client) client.release();
  }
}

export async function PUT(request) {
  let body;
  try {
    body = await request.json();
    validateRequiredProductFields(body, true);
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Invalid product payload' }, { status: 400 });
  }

  const product = parseProductPayload(body);

  if (shouldUseLocalCatalogFallbackFirst()) {
    const updatedProduct = mapProductData({
      ...(getStore().find((p) => String(p.id) === String(body.id) || p.slug === body.slug) || {}),
      ...product,
      id: body.id,
      collection_id: product.collectionId || 1,
      collection_slugs: product.collectionSlugs,
      collection_slug: product.collectionSlugs[0] || 'suits',
      tags: normalizeLocalProductTags(body),
    });
    upsertProduct(updatedProduct);
    return NextResponse.json({ success: true, product: updatedProduct });
  }

  let client;
  try {
    client = await pool.connect();
    const shouldReplaceTags =
      Object.prototype.hasOwnProperty.call(body, 'tag_ids') ||
      Object.prototype.hasOwnProperty.call(body, 'tags');
    const tagIds = shouldReplaceTags ? normalizeTagIds(body) : null;

    await client.query('BEGIN');
    await validateCollection(client, product.collectionId);

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

    if (shouldReplaceTags) {
      await replaceProductTags(client, body.id, [...(tagIds || []), ...(product.tags || [])]);
    }
    const savedProduct = await fetchProductById(client, body.id);
    await client.query('COMMIT');

    return NextResponse.json({ success: true, product: savedProduct });
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    console.error('Admin PUT product error:', error);
    const existing = getStore().find((p) => String(p.id) === String(body.id) || p.slug === body.slug);
    const updatedProduct = mapProductData({
      ...(existing || {}),
      ...product,
      id: body.id,
      collection_id: product.collectionId || (existing && existing.collection_id) || 1,
      collection_slugs: product.collectionSlugs,
      collection_slug: product.collectionSlugs[0] || (existing && existing.collection_slug) || 'suits',
      tags: Array.isArray(product.tags) ? product.tags : [],
    });
    upsertProduct(updatedProduct);
    return NextResponse.json({ success: true, product: updatedProduct });
  } finally {
    if (client) client.release();
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
  }

  if (shouldUseLocalCatalogFallbackFirst()) {
    removeProduct(id);
    return NextResponse.json({ success: true, deletedId: id });
  }

  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Admin DELETE product error:', error);
    removeProduct(id);
    return NextResponse.json({ success: true, deletedId: id });
  }
}
