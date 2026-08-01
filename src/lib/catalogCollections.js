export const REQUIRED_CATALOG_COLLECTIONS = [
  {
    name: 'New Collection',
    slug: 'new-collection',
    description: 'The latest House of Ginija arrivals and seasonal edits.',
  },
  {
    name: 'Co-ords',
    slug: 'co-ords',
    description: 'Contemporary coordinated sets designed for effortless dressing.',
  },
  {
    name: 'Heavy Dresses',
    slug: 'heavy-dresses',
    description: 'Statement occasion wear featuring intricate craftsmanship and rich detailing.',
  },
  {
    name: 'Indo Western',
    slug: 'indo-western',
    description: 'Modern silhouettes blending Indian craftsmanship with western styling.',
    parentSlug: 'heavy-dresses',
  },
  {
    name: 'Heavy Gowns',
    slug: 'heavy-gowns',
    description: 'Elaborate gowns created for weddings, celebrations, and evening occasions.',
    parentSlug: 'heavy-dresses',
  },
  {
    name: 'Shararas',
    slug: 'shararas',
    description: 'Elegant sharara ensembles with refined traditional detailing.',
    parentSlug: 'heavy-dresses',
  },
];

export async function ensureCatalogCollections(db) {
  await db.query('ALTER TABLE collections ADD COLUMN IF NOT EXISTS parent_slug VARCHAR(100)');

  const values = REQUIRED_CATALOG_COLLECTIONS.flatMap(({ name, slug, description, parentSlug = null }) => [
    name,
    slug,
    description,
    parentSlug,
  ]);
  const placeholders = REQUIRED_CATALOG_COLLECTIONS.map((_, index) => {
    const offset = index * 4;
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, NULL, $${offset + 4})`;
  }).join(', ');

  await db.query(
    `INSERT INTO collections (name, slug, description, image_url, parent_slug)
     VALUES ${placeholders}
     ON CONFLICT (slug) DO UPDATE
     SET name = EXCLUDED.name,
         description = EXCLUDED.description,
         parent_slug = EXCLUDED.parent_slug`,
    values
  );
}