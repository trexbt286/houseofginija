export const PRODUCT_SELECT_FIELDS = `
  p.*,
  c.name AS collection_name,
  c.slug AS collection_slug,
  parent_c.name AS parent_collection_name,
  parent_c.slug AS parent_collection_slug,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
        ORDER BY t.name ASC
      )
      FROM product_tags pt
      INNER JOIN tags t ON t.id = pt.tag_id
      WHERE pt.product_id = p.id
    ),
    '[]'::json
  ) AS tags
`;

export const PRODUCT_COLLECTION_JOINS = `
  LEFT JOIN collections c ON p.collection_id = c.id
  LEFT JOIN collections parent_c ON c.parent_id = parent_c.id
`;

export function mapProductData(product) {
  let images = product.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch {}
  }

  let variants = product.variants;
  if (typeof variants === 'string') {
    try { variants = JSON.parse(variants); } catch {}
  }

  let tags = product.tags;
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags); } catch {}
  }

  return {
    ...product,
    on_sale: Boolean(product.on_sale),
    images: Array.isArray(images) ? images : [],
    variants: Array.isArray(variants) ? variants : [],
    tags: Array.isArray(tags) ? tags : [],
  };
}

export function buildCategoryTree(collections) {
  const activeCollections = collections.filter((collection) => collection.is_active !== false);
  const childrenByParent = new Map();

  activeCollections.forEach((collection) => {
    const parentKey = collection.parent_id == null ? 'root' : String(collection.parent_id);
    if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
    childrenByParent.get(parentKey).push(collection);
  });

  const sortCategories = (items) => [...items].sort((a, b) => {
    const sortDelta = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    return sortDelta || String(a.name).localeCompare(String(b.name));
  });

  return sortCategories(childrenByParent.get('root') || []).map((parent) => ({
    ...parent,
    children: sortCategories(childrenByParent.get(String(parent.id)) || []),
  }));
}

export function normalizeTagIds(payload) {
  const rawTags = Array.isArray(payload.tag_ids)
    ? payload.tag_ids
    : Array.isArray(payload.tags)
      ? payload.tags.map((tag) => (typeof tag === 'object' ? tag.id : tag))
      : [];

  return [...new Set(
    rawTags
      .map((tagId) => Number.parseInt(tagId, 10))
      .filter((tagId) => Number.isInteger(tagId) && tagId > 0)
  )];
}

export async function validateCollection(client, collectionId) {
  if (collectionId == null) return;

  const result = await client.query(
    'SELECT id FROM collections WHERE id = $1 AND is_active = TRUE',
    [collectionId]
  );

  if (result.rowCount !== 1) {
    const error = new Error('Selected category is not available.');
    error.status = 400;
    throw error;
  }
}

export async function validateTagIds(client, tagIds) {
  if (tagIds.length === 0) return;

  const result = await client.query(
    'SELECT id FROM tags WHERE id = ANY($1::int[])',
    [tagIds]
  );

  if (result.rowCount !== tagIds.length) {
    const error = new Error('One or more selected tags are invalid.');
    error.status = 400;
    throw error;
  }
}

export async function replaceProductTags(client, productId, tagIds) {
  await client.query('DELETE FROM product_tags WHERE product_id = $1', [productId]);

  if (tagIds.length > 0) {
    await client.query(
      `
        INSERT INTO product_tags (product_id, tag_id)
        SELECT $1, tag_id
        FROM unnest($2::int[]) AS selected_tags(tag_id)
        ON CONFLICT (product_id, tag_id) DO NOTHING
      `,
      [productId, tagIds]
    );
  }
}
