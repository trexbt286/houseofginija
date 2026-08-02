import homepageFallback from '@/data/local-homepage-fallback.json';
import productsFallback from '@/data/local-products-fallback.json';

const isProduction = process.env.NODE_ENV === 'production';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isBuild = process.env.NEXT_PHASE === 'phase-production-build';

const fallbackTags = [
  { id: '1', name: 'Cotton', slug: 'cotton' },
  { id: '2', name: 'Linen', slug: 'linen' },
  { id: '3', name: 'Muslin', slug: 'muslin' },
  { id: '4', name: 'Bestseller', slug: 'bestseller' },
  { id: '5', name: 'Limited Edition', slug: 'limited-edition' },
];

function buildCategoryTree(collections) {
  const active = collections.filter((collection) => collection.is_active !== false);
  const byParent = new Map();

  active.forEach((collection) => {
    const key = collection.parent_id == null ? 'root' : String(collection.parent_id);
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(collection);
  });

  const sortCategories = (items) => [...items].sort((a, b) => {
    const sortDelta = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    return sortDelta || String(a.name).localeCompare(String(b.name));
  });

  return sortCategories(byParent.get('root') || []).map((parent) => ({
    ...parent,
    children: sortCategories(byParent.get(String(parent.id)) || []),
  }));
}

export function canUseLocalCatalogFallback() {
  return isBuild || !hasDatabaseUrl;
}

export function shouldUseLocalCatalogFallbackFirst() {
  return isBuild || !hasDatabaseUrl;
}

export function getLocalCollectionsFallback() {
  return homepageFallback.collections || [];
}

export function getLocalCategoryTreeFallback() {
  return buildCategoryTree(getLocalCollectionsFallback());
}

export function getLocalTagsFallback() {
  return fallbackTags;
}

export function getLocalHomepageFallback() {
  return homepageFallback;
}

export function getLocalProductsFallback() {
  const catalogProducts = productsFallback.products || [];
  const homepageCategoryProducts = Object.values(homepageFallback.heavyDresses || {}).flat();
  const knownSlugs = new Set(catalogProducts.map((product) => product.slug));

  return [
    ...catalogProducts,
    ...homepageCategoryProducts.filter((product) => !knownSlugs.has(product.slug)),
  ];
}

export function getLocalProductsResponseFallback() {
  return {
    products: getLocalProductsFallback(),
    flash_sale_enabled: productsFallback.flash_sale_enabled ?? true,
  };
}

export function getLocalProductBySlugFallback(slug) {
  return getLocalProductsFallback().find((product) => product.slug === slug);
}
