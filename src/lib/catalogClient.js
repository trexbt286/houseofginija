export function productMatchesCategory(product, selectedCategory) {
  if (!selectedCategory) return true;

  if (selectedCategory === 'rings') {
    return product.slug.toLowerCase().includes('ring');
  }
  if (selectedCategory === 'necklaces') {
    return product.slug.toLowerCase().includes('necklace');
  }
  if (selectedCategory === 'bracelets') {
    return product.slug.toLowerCase().includes('bracelet');
  }

  const categoryMatch =
    product.collection_slug === selectedCategory ||
    product.parent_collection_slug === selectedCategory ||
    (selectedCategory === 'gowns' && product.collection_slug === 'heavy-gown');

  if (categoryMatch) return true;
  if (selectedCategory === 'new-collection') return Boolean(product.new_arrival);
  if (selectedCategory === 'flash-sale') {
    return Boolean(product.on_sale || product.flash_sale);
  }

  return false;
}

export function compareCatalogProducts(a, b, selectedSort = 'name_asc') {
  const saleDelta = Number(Boolean(b.on_sale)) - Number(Boolean(a.on_sale));
  if (saleDelta) return saleDelta;

  const flashDelta = Number(Boolean(b.flash_sale)) - Number(Boolean(a.flash_sale));
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
  if (selectedCategory === 'rings') return 'Rings';
  if (selectedCategory === 'necklaces') return 'Necklaces';
  if (selectedCategory === 'bracelets') return 'Bracelets';

  const category = collections.find((item) => item.slug === selectedCategory);
  return category ? category.name : 'Collection';
}
