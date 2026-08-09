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

function persistStoreToDisk(store) {
  try {
    if (typeof window !== 'undefined') return;
    const req = eval('require');
    const fs = req('fs');
    const path = req('path');
    if (!fs || !path) return;

    const prodsFilePath = path.join(process.cwd(), 'src/data/local-products-fallback.json');
    const homeFilePath = path.join(process.cwd(), 'src/data/local-homepage-fallback.json');

    if (fs.existsSync(prodsFilePath)) {
      const content = { products: store };
      fs.writeFileSync(prodsFilePath, JSON.stringify(content, null, 2), 'utf8');
    }

    if (fs.existsSync(homeFilePath)) {
      const homeContent = JSON.parse(fs.readFileSync(homeFilePath, 'utf8'));
      homeContent.flashProducts = store.filter((p) => Boolean(p.flash_sale || p.on_sale));
      fs.writeFileSync(homeFilePath, JSON.stringify(homeContent, null, 2), 'utf8');
    }
  } catch (err) {
    // Silent catch for client bundle context
  }
}

const STORE_KEY = '__houseOfGinijaProductStore';

function buildInitialStore() {
  const catalogProducts = productsFallback.products || [];
  const homepageCategoryProducts = Object.values(homepageFallback.heavyDresses || {}).flat();

  const knownSlugs = new Set(catalogProducts.map((p) => p.slug));
  const knownImages = new Set(
    catalogProducts
      .map((p) => (Array.isArray(p.images) && p.images[0]) || p.image_url)
      .filter(Boolean)
  );

  const uniqueAdditions = homepageCategoryProducts.filter((p) => {
    const img = (Array.isArray(p.images) && p.images[0]) || p.image_url;
    if (knownSlugs.has(p.slug)) return false;
    if (img && knownImages.has(img)) return false;
    return true;
  });

  return [...catalogProducts, ...uniqueAdditions];
}

/**
 * Return the current store array.  Initialises from the static JSON fallback
 * on first call.
 */
export function getStore() {
  if (!globalThis[STORE_KEY]) {
    globalThis[STORE_KEY] = buildInitialStore();
  }
  return globalThis[STORE_KEY];
}

/**
 * Replace the entire store (used after bulk operations).
 */
export function setStore(products) {
  globalThis[STORE_KEY] = Array.isArray(products) ? products : [];
  persistStoreToDisk(globalThis[STORE_KEY]);
}

/**
 * Upsert a product into the store by id.
 * If a product with the same id exists it is replaced; otherwise prepended.
 */
export function upsertProduct(product) {
  const store = getStore();
  const idx = store.findIndex((p) => String(p.id) === String(product.id) || p.slug === product.slug);
  if (idx !== -1) {
    store[idx] = { ...store[idx], ...product };
  } else {
    store.unshift(product);
  }
  persistStoreToDisk(store);
}

/**
 * Remove a product from the store by id.
 */
export function removeProduct(id) {
  globalThis[STORE_KEY] = getStore().filter((p) => String(p.id) !== String(id));
  persistStoreToDisk(globalThis[STORE_KEY]);
}

/**
 * Find a single product by slug.
 */
export function findBySlug(slug) {
  return getStore().find((p) => p.slug === slug) || null;
}
