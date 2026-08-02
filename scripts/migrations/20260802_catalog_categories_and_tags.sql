BEGIN;

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS parent_id INTEGER,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'collections_parent_id_fkey'
      AND conrelid = 'collections'::regclass
  ) THEN
    ALTER TABLE collections
      ADD CONSTRAINT collections_parent_id_fkey
      FOREIGN KEY (parent_id) REFERENCES collections(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS collections_parent_id_idx ON collections(parent_id);
CREATE INDEX IF NOT EXISTS collections_active_sort_idx ON collections(is_active, sort_order, id);

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS on_sale BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS products_on_sale_idx ON products(on_sale DESC);
CREATE INDEX IF NOT EXISTS products_collection_on_sale_idx ON products(collection_id, on_sale DESC);

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

CREATE INDEX IF NOT EXISTS tags_slug_idx ON tags(slug);
CREATE INDEX IF NOT EXISTS product_tags_tag_id_idx ON product_tags(tag_id, product_id);

INSERT INTO collections (name, slug, description, sort_order, is_active)
VALUES
  ('New Collection', 'new-collection', 'The latest House of Ginija seasonal creations.', 10, TRUE),
  ('Heavy Dresses', 'heavy-dresses', 'Statement occasion wear and elevated festive silhouettes.', 20, TRUE),
  ('Co-ords', 'co-ords', 'Contemporary coordinated sets.', 30, TRUE),
  ('Unstitched Suits', 'suits', 'Premium unstitched suits and fine archival fabrics.', 40, TRUE),
  ('Jewellery', 'jewellery', 'Exquisite artisan-crafted jewellery.', 50, TRUE),
  ('Flash Sale', 'flash-sale', 'Limited-time House of Ginija offers.', 60, TRUE)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

UPDATE collections
SET parent_id = NULL
WHERE slug IN ('new-collection', 'heavy-dresses', 'co-ords', 'suits', 'jewellery', 'flash-sale');

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM collections WHERE slug = 'heavy-gown')
     AND NOT EXISTS (SELECT 1 FROM collections WHERE slug = 'gowns') THEN
    UPDATE collections
    SET slug = 'gowns', name = 'Gowns'
    WHERE slug = 'heavy-gown';
  END IF;
END $$;

INSERT INTO collections (name, slug, description, parent_id, sort_order, is_active)
SELECT child.name, child.slug, child.description, parent.id, child.sort_order, TRUE
FROM collections parent
CROSS JOIN (VALUES
  ('Muslin', 'muslin', 'Lightweight muslin creations.', 10),
  ('Cotton', 'cotton', 'Breathable cotton creations.', 20),
  ('Cotton Linen', 'cotton-linen', 'Cotton-linen blend creations.', 30)
) AS child(name, slug, description, sort_order)
WHERE parent.slug = 'new-collection'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

INSERT INTO collections (name, slug, description, parent_id, sort_order, is_active)
SELECT child.name, child.slug, child.description, parent.id, child.sort_order, TRUE
FROM collections parent
CROSS JOIN (VALUES
  ('Indo-Western', 'indo-western', 'Traditional artistry with contemporary silhouettes.', 10),
  ('Shararas', 'shararas', 'Embellished sharara sets.', 20),
  ('Gowns', 'gowns', 'Opulent floor-length gowns.', 30)
) AS child(name, slug, description, sort_order)
WHERE parent.slug = 'heavy-dresses'
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  parent_id = EXCLUDED.parent_id,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

UPDATE collections
SET is_active = FALSE
WHERE slug = 'heavy-gown'
  AND EXISTS (SELECT 1 FROM collections WHERE slug = 'gowns');

INSERT INTO tags (name, slug)
VALUES
  ('Cotton', 'cotton'),
  ('Linen', 'linen'),
  ('Muslin', 'muslin'),
  ('Bestseller', 'bestseller'),
  ('Limited Edition', 'limited-edition')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

COMMIT;
