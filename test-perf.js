const products = Array.from({ length: 10000 }, (_, i) => ({
  categoryId: 'cat1',
  name: `Product ${i} Name`,
  sku: `SKU-${i}`
}));

const searchQuery = 'Product 999';

console.time('Inside loop');
for(let i=0; i<100; i++) {
  products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
}
console.timeEnd('Inside loop');

console.time('Outside loop');
for(let i=0; i<100; i++) {
  const lowerQuery = searchQuery.toLowerCase();
  products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(lowerQuery) ||
      p.sku.toLowerCase().includes(lowerQuery);
    return matchesSearch;
  });
}
console.timeEnd('Outside loop');
