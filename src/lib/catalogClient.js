export function productMatchesCategory(product, selectedCategory) {
  if (!selectedCategory) return true;

  const cat = selectedCategory.toLowerCase();
  const slug = (product.slug || '').toLowerCase();
  const colSlug = (product.collection_slug || '').toLowerCase();
  const parentColSlug = (product.parent_collection_slug || '').toLowerCase();
  const colName = (product.collection_name || '').toLowerCase();

  if (cat === 'rings' || cat === 'ring') {
    return (slug.includes('ring') && !slug.includes('earring')) || colSlug === 'rings';
  }
  if (cat === 'necklaces' || cat === 'necklace') {
    return slug.includes('necklace') || colSlug === 'necklaces';
  }
  if (cat === 'bracelets' || cat === 'bracelet') {
    return slug.includes('bracelet') || colSlug === 'bracelets';
  }
  if (cat === 'earrings' || cat === 'earring') {
    return slug.includes('earring') || colSlug === 'earrings';
  }

  const categoryMatch =
    colSlug === cat ||
    parentColSlug === cat ||
    colName === cat ||
    (cat === 'gowns' && (colSlug === 'heavy-gown' || colSlug === 'gowns' || slug.includes('gown'))) ||
    (cat === 'shararas' && (colSlug === 'shararas' || slug.includes('sharara'))) ||
    (cat === 'indo-western' && (
      colSlug === 'indo-western' ||
      slug.includes('indo-western') ||
      String(product.collection_id) === '8' ||
      (Array.isArray(product.collection_slugs) && product.collection_slugs.includes('indo-western'))
    ));

  if (categoryMatch) return true;
  if (cat === 'new-collection') return Boolean(product.new_arrival);
  if (cat === 'flash-sale') {
    return Boolean(product.on_sale || product.flash_sale);
  }

  return false;
}

export function compareCatalogProducts(a, b, selectedSort = 'name_asc') {
  const flashDelta = Number(Boolean(b.flash_sale || b.on_sale)) - Number(Boolean(a.flash_sale || a.on_sale));
  if (flashDelta) return flashDelta;

  if (selectedSort === 'price_asc') {
    return Number.parseFloat(a.price) - Number.parseFloat(b.price);
  }
  if (selectedSort === 'price_desc') {
    return Number.parseFloat(b.price) - Number.parseFloat(a.price);
  }

  return a.name.localeCompare(b.name, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

export function getCategoryTitle(collections, selectedCategory) {
  if (!selectedCategory) return 'All collections';
  if (selectedCategory === 'rings' || selectedCategory === 'ring') return 'Rings';
  if (selectedCategory === 'necklaces' || selectedCategory === 'necklace') return 'Necklaces';
  if (selectedCategory === 'bracelets' || selectedCategory === 'bracelet') return 'Bracelets';
  if (selectedCategory === 'earrings' || selectedCategory === 'earring') return 'Earrings';
  if (selectedCategory === 'new-collection') return 'Fresh Collection';
  if (selectedCategory === 'flash-sale') return 'Flash Sale';

  const match = (collections || []).find((c) => c.slug === selectedCategory);
  return match ? match.name : selectedCategory.replace(/-/g, ' ');
}

export function getStoredLocalCatalogOverrides() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('houseofginija_custom_products');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveStoredLocalCatalogOverride(product) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredLocalCatalogOverrides();
    const idx = existing.findIndex((p) => String(p.id) === String(product.id) || p.slug === product.slug);
    let updated;
    if (idx !== -1) {
      updated = existing.map((p, i) => (i === idx ? { ...p, ...product } : p));
    } else {
      updated = [product, ...existing];
    }
    localStorage.setItem('houseofginija_custom_products', JSON.stringify(updated));
  } catch {}
}

export function removeStoredLocalCatalogOverride(id) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredLocalCatalogOverrides();
    const updated = existing.filter((p) => String(p.id) !== String(id));
    localStorage.setItem('houseofginija_custom_products', JSON.stringify(updated));
  } catch {}
}

export function mergeCatalogWithLocalOverrides(fetchedList = []) {
  const overrides = getStoredLocalCatalogOverrides();
  if (!Array.isArray(overrides) || overrides.length === 0) return fetchedList;

  let merged = [...fetchedList];
  overrides.forEach((override) => {
    const idx = merged.findIndex((p) => String(p.id) === String(override.id) || p.slug === override.slug);
    if (idx !== -1) {
      merged[idx] = { ...merged[idx], ...override };
    } else {
      merged.unshift(override);
    }
  });

  return merged.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}
