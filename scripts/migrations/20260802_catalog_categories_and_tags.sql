BEGIN;

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS parent_id INTEGER,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE collections
  DROP CONSTRAINT IF EXISTS collections_parent_id_fkey;

ALTER TABLE collections
  ADD CONSTRAINT collections_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES collections(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS collections_parent_id_idx;
CREATE INDEX collections_parent_id_idx ON collections(parent_id);
DROP INDEX IF EXISTS collections_active_sort_idx;
CREATE INDEX collections_active_sort_idx ON collections(is_active, sort_order, id);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS on_sale BOOLEAN NOT NULL DEFAULT FALSE;

DROP INDEX IF EXISTS products_on_sale_idx;
CREATE INDEX products_on_sale_idx ON products(on_sale DESC);
DROP INDEX IF EXISTS products_collection_on_sale_idx;
CREATE INDEX products_collection_on_sale_idx ON products(collection_id, on_sale DESC);

CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_tags (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, tag_id)
);

DROP INDEX IF EXISTS tags_slug_idx;
CREATE INDEX tags_slug_idx ON tags(slug);
DROP INDEX IF EXISTS product_tags_tag_id_idx;
CREATE INDEX product_tags_tag_id_idx ON product_tags(tag_id, product_id);

INSERT INTO collections (slug, name, description, sort_order, is_active)
VALUES
  ('new-collection', 'New Collection', 'The latest House of Ginija seasonal creations.', 10, TRUE),
  ('heavy-dresses', 'Heavy Dresses', 'Statement occasion wear and elevated festive silhouettes.', 20, TRUE),
  ('co-ords', 'Co-ords', 'Contemporary coordinated sets.', 30, TRUE),
  ('suits', 'Unstitched Suits', 'Premium unstitched suits and fine archival fabrics.', 40, TRUE),
  ('jewellery', 'Jewellery', 'Exquisite artisan-crafted jewellery.', 50, TRUE),
  ('flash-sale', 'Flash Sale', 'Limited-time House of Ginija offers.', 60, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

UPDATE collections
SET parent_id = NULL
WHERE slug IN ('new-collection', 'heavy-dresses', 'co-ords', 'suits', 'jewellery', 'flash-sale');

UPDATE collections
SET slug = 'gowns', name = 'Gowns'
WHERE slug = 'heavy-gown'
  AND NOT EXISTS (SELECT 1 FROM collections WHERE slug = 'gowns');

INSERT INTO collections (slug, name, description, parent_id, sort_order, is_active)
SELECT child.slug, child.name, child.description, parent.id, child.sort_order, TRUE
FROM collections parent
CROSS JOIN (VALUES
  ('muslin', 'Muslin', 'Lightweight muslin creations.', 10),
  ('cotton', 'Cotton', 'Breathable cotton creations.', 20),
  ('cotton-linen', 'Cotton Linen', 'Cotton-linen blend creations.', 30)
) AS child(slug, name, description, sort_order)
WHERE parent.slug = 'new-collection'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

INSERT INTO collections (slug, name, description, parent_id, sort_order, is_active)
SELECT child.slug, child.name, child.description, parent.id, child.sort_order, TRUE
FROM collections parent
CROSS JOIN (VALUES
  ('indo-western', 'Indo-Western', 'Traditional artistry with contemporary silhouettes.', 10),
  ('shararas', 'Shararas', 'Embellished sharara sets.', 20),
  ('gowns', 'Gowns', 'Opulent floor-length gowns.', 30)
) AS child(slug, name, description, sort_order)
WHERE parent.slug = 'heavy-dresses'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

UPDATE collections
SET is_active = FALSE
WHERE slug = 'heavy-gown'
  AND EXISTS (SELECT 1 FROM collections WHERE slug = 'gowns');

INSERT INTO tags (slug, name)
VALUES
  ('cotton', 'Cotton'),
  ('linen', 'Linen'),
  ('muslin', 'Muslin'),
  ('bestseller', 'Bestseller'),
  ('limited-edition', 'Limited Edition')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name;

COMMIT;
