const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'local-products-fallback.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

const sampleTags = [
  [
    { id: 'pure-cotton', name: 'Pure Cotton', slug: 'pure-cotton' },
    { id: 'hand-embellished', name: 'Hand Embellished', slug: 'hand-embellished' }
  ],
  [
    { id: 'handcrafted-artisan', name: 'Handcrafted Artisan', slug: 'handcrafted-artisan' },
    { id: 'limited-edition', name: 'Limited Edition', slug: 'limited-edition' }
  ],
  [
    { id: 'zari-embroidery', name: 'Zari Embroidery', slug: 'zari-embroidery' },
    { id: 'festive-edition', name: 'Festive Edition', slug: 'festive-edition' }
  ],
  [
    { id: 'bestseller', name: 'Bestseller', slug: 'bestseller' },
    { id: 'archival-fabric', name: 'Archival Fabric', slug: 'archival-fabric' }
  ]
];

data.products.forEach((product, idx) => {
  if (!product.tags || product.tags.length === 0) {
    product.tags = sampleTags[idx % sampleTags.length];
  }
});

fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
console.log('Successfully updated local-products-fallback.json with sample tags for all products.');
