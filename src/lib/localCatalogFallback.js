import homepageFallback from '@/data/local-homepage-fallback.json';
import productsFallback from '@/data/local-products-fallback.json';

const isProduction = process.env.NODE_ENV === 'production';

export function canUseLocalCatalogFallback() {
  return !isProduction;
}

export function shouldUseLocalCatalogFallbackFirst() {
  return canUseLocalCatalogFallback() && !process.env.DATABASE_URL;
}

export function getLocalCollectionsFallback() {
  return homepageFallback.collections || [];
}

export function getLocalHomepageFallback() {
  return homepageFallback;
}

export function getLocalProductsFallback() {
  return productsFallback.products || [];
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
