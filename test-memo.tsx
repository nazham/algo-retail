import { useMemo } from 'react';
export function Test() {
  const products = [];
  const selectedCategoryId = null;
  const searchQuery = 'test';

  const filteredProducts = useMemo(() => {
    // Optimization: avoid repeatedly calling toLowerCase() on the search query
    const lowerQuery = searchQuery.toLowerCase();

    return products.filter((p) => {
      // Category filter (if a category is selected)
      const matchesCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;

      // Search filter
      const matchesSearch =
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku.toLowerCase().includes(lowerQuery);

      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategoryId, searchQuery]);
}
