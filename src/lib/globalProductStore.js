/**
 * globalProductStore.js
 *
 * Shared singleton in-memory product store for the dev/local fallback path.
 * Both admin routes and public product routes read/write this store, so any
 * changes made in the Admin Portal (including custom tags) are immediately
 * visible on the Product Detail page without a database or a page reload.
 */

import productsFallback from '@/data/local-products-fallback.json';
import homepageFallback from '@/data/local-homepage-fallback.json';

/**
 * The mutable in-memory store.  null means "not yet initialised".
 * Using a global variable at module scope ensures a single instance
 * across all Next.js route handlers that import this file within the
 * same server process.
 */
let _store = null;

function buildInitialStore() {
  const catalogProducts = productsFallback.products || [];
  const homepageCategoryProducts = Object.values(homepageFallback.heavyDresses || {}).flat();
  const knownSlugs = new Set(catalogProducts.map((p) => p.slug));

  return [
    ...catalogProducts,
    ...homepageCategoryProducts.filter((p) => !knownSlugs.has(p.slug)),
  ];
}

/**
 * Return the current store array.  Initialises from the static JSON fallback
 * on first call.
 */
export function getStore() {
  if (!_store) {
    _store = buildInitialStore();
  }
  return _store;
}

/**
 * Replace the entire store (used after bulk operations).
 */
export function setStore(products) {
  _store = Array.isArray(products) ? products : [];
}

/**
 * Upsert a product into the store by id.
 * If a product with the same id exists it is replaced; otherwise prepended.
 */
export function upsertProduct(product) {
  const store = getStore();
  const idx = store.findIndex((p) => String(p.id) === String(product.id) || p.slug === product.slug);
  if (idx !== -1) {
    store[idx] = product;
  } else {
    store.unshift(product);
  }
}

/**
 * Remove a product from the store by id.
 */
export function removeProduct(id) {
  _store = getStore().filter((p) => String(p.id) !== String(id));
}

/**
 * Find a single product by slug.
 */
export function findBySlug(slug) {
  return getStore().find((p) => p.slug === slug) || null;
}
