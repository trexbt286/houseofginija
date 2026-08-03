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

  let collection_slugs = product.collection_slugs;
  if (typeof collection_slugs === 'string') {
    try { collection_slugs = JSON.parse(collection_slugs); } catch {}
  }
  if (!Array.isArray(collection_slugs) || collection_slugs.length === 0) {
    const derived = [];
    if (product.collection_slug) derived.push(product.collection_slug);
    if (product.parent_collection_slug) derived.push(product.parent_collection_slug);
    if (product.new_arrival) derived.push('new-collection');
    if (product.on_sale || product.flash_sale) derived.push('flash-sale');
    collection_slugs = [...new Set(derived)];
  }

  return {
    ...product,
    on_sale: Boolean(product.on_sale),
    images: Array.isArray(images) ? images : [],
    variants: Array.isArray(variants) ? variants : [],
    tags: Array.isArray(tags) ? tags : [],
    collection_slugs: Array.isArray(collection_slugs) ? collection_slugs : [],
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

export async function replaceProductTags(client, productId, rawTagsPayload = []) {
  await client.query('DELETE FROM product_tags WHERE product_id = $1', [productId]);

  if (!Array.isArray(rawTagsPayload) || rawTagsPayload.length === 0) return;

  const tagIds = [];

  for (const tagItem of rawTagsPayload) {
    if (typeof tagItem === 'number' || (typeof tagItem === 'string' && /^\d+$/.test(tagItem))) {
      tagIds.push(Number(tagItem));
    } else {
      const name = typeof tagItem === 'string' ? tagItem.trim() : (tagItem.name || tagItem.slug || '').trim();
      if (!name) continue;
      const slug = typeof tagItem === 'object' && tagItem.slug
        ? tagItem.slug
        : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      try {
        const tagResult = await client.query(
          `
            INSERT INTO tags (name, slug)
            VALUES ($1, $2)
            ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
          `,
          [name, slug]
        );

        if (tagResult.rows[0]?.id) {
          tagIds.push(tagResult.rows[0].id);
        }
      } catch (err) {
        console.warn('Error upserting custom tag:', err);
      }
    }
  }

  const uniqueTagIds = [...new Set(tagIds)];

  if (uniqueTagIds.length > 0) {
    await client.query(
      `
        INSERT INTO product_tags (product_id, tag_id)
        SELECT $1, selected_tags.tag_id
        FROM unnest($2::int[]) AS selected_tags(tag_id)
        WHERE NOT EXISTS (
          SELECT 1 FROM product_tags pt 
          WHERE pt.product_id = $1 AND pt.tag_id = selected_tags.tag_id
        )
      `,
      [productId, uniqueTagIds]
    );
  }
}
