import { useState, useEffect } from 'react';
import type { CategoryDto } from '@algo/types';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.api
      .invoke('categories:get-all')
      .then(setCategories)
      .catch((err) => console.error('Failed to fetch categories', err))
      .finally(() => setIsLoading(false));
  }, []);

  return { categories, isLoading };
}
