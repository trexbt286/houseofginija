import homepageFallback from '@/data/local-homepage-fallback.json';
import productsFallback from '@/data/local-products-fallback.json';
import localSettings from '@/data/local-settings.json';
import { getStore, findBySlug } from '@/lib/globalProductStore';

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
  return true;
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
  const store = getStore();
  const flashProducts = store.filter((p) => Boolean(p.flash_sale || p.on_sale || (Array.isArray(p.collection_slugs) && p.collection_slugs.includes('flash-sale'))));
  const newArrivalProducts = store.filter((p) => Boolean(p.new_arrival || (Array.isArray(p.collection_slugs) && p.collection_slugs.includes('new-collection'))));

  const isIndoWestern = (p) => p.collection_slug === 'indo-western' || (Array.isArray(p.collection_slugs) && p.collection_slugs.includes('indo-western')) || String(p.collection_id) === '8';
  const isGown = (p) => p.collection_slug === 'gowns' || p.collection_slug === 'heavy-gown' || (Array.isArray(p.collection_slugs) && p.collection_slugs.some((s) => s === 'gowns' || s === 'heavy-gown')) || String(p.collection_id) === '10';
  const isSharara = (p) => p.collection_slug === 'shararas' || (Array.isArray(p.collection_slugs) && p.collection_slugs.includes('shararas')) || String(p.collection_id) === '9';

  const heavyDresses = {
    indoWestern: store.filter(isIndoWestern),
    heavyGown: store.filter(isGown),
    shararas: store.filter(isSharara),
  };

  const jewelleryEnabled = localSettings.jewellery_enabled !== 'false';

  return {
    ...homepageFallback,
    flashProducts,
    flash_sale_enabled: true,
    newArrivalProducts,
    new_arrivals_enabled: true,
    jewellery_enabled: jewelleryEnabled,
    heavyDresses,
  };
}

export function getLocalProductsFallback() {
  return getStore();
}

export function getLocalProductsResponseFallback() {
  return {
    products: getStore(),
    flash_sale_enabled: productsFallback.flash_sale_enabled ?? true,
  };
}

export function getLocalProductBySlugFallback(slug) {
  return findBySlug(slug);
}
