export function productMatchesCategory(product, selectedCategory) {
  if (!selectedCategory) return true;

  const cat = selectedCategory.toLowerCase();
  const colSlug = (product.collection_slug || '').toLowerCase();
  const parentColSlug = (product.parent_collection_slug || '').toLowerCase();
  const colName = (product.collection_name || '').toLowerCase();
  const colSlugs = Array.isArray(product.collection_slugs) ? product.collection_slugs.map((s) => String(s).toLowerCase()) : [];
  const colId = String(product.collection_id || '');

  if (cat === 'new-collection') {
    return Boolean(product.new_arrival || colSlugs.includes('new-collection'));
  }
  if (cat === 'flash-sale') {
    return Boolean(product.on_sale || product.flash_sale || colSlugs.includes('flash-sale'));
  }

  if (cat === 'rings' || cat === 'ring') {
    return colSlug === 'rings' || colSlugs.includes('rings') || colId === '5';
  }
  if (cat === 'necklaces' || cat === 'necklace') {
    return colSlug === 'necklaces' || colSlugs.includes('necklaces') || colId === '2';
  }
  if (cat === 'bracelets' || cat === 'bracelet') {
    return colSlug === 'bracelets' || colSlugs.includes('bracelets') || colId === '6';
  }
  if (cat === 'earrings' || cat === 'earring') {
    return colSlug === 'earrings' || colSlugs.includes('earrings') || colId === '4';
  }
  if (cat === 'suits' || cat === 'unstitched') {
    return colSlug === 'suits' || colSlug === 'unstitched' || colSlugs.includes('suits') || colId === '1';
  }
  if (cat === 'indo-western') {
    return colSlug === 'indo-western' || colSlugs.includes('indo-western') || colId === '8';
  }
  if (cat === 'gowns' || cat === 'heavy-gown') {
    return colSlug === 'gowns' || colSlug === 'heavy-gown' || colSlugs.includes('gowns') || colSlugs.includes('heavy-gown') || colId === '10';
  }
  if (cat === 'shararas') {
    return colSlug === 'shararas' || colSlugs.includes('shararas') || colId === '9';
  }
  if (cat === 'co-ords') {
    return colSlug === 'co-ords' || colSlugs.includes('co-ords') || colId === '11';
  }

  return (
    colSlug === cat ||
    parentColSlug === cat ||
    colName === cat ||
    colSlugs.includes(cat) ||
    colId === cat
  );
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

  const cleanOverrides = overrides.filter((p) => {
    if (p.name === 'Champagne Drape Saree' && String(p.price) === '15001') return false;
    if (p.name === 'Blush Pink Drape' && String(p.price) === '8500') return false;
    if (p.slug === 'champagne-drape-saree') return false;
    if (p.slug === 'blush-pink-drape') return false;
    return true;
  });

  let merged = [...fetchedList];
  cleanOverrides.forEach((override) => {
    const idx = merged.findIndex((p) => String(p.id) === String(override.id) || p.slug === override.slug);
    if (idx !== -1) {
      merged[idx] = { ...merged[idx], ...override };
    } else {
      merged.unshift(override);
    }
  });

  return merged;
}
