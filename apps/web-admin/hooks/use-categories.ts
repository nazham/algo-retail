import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CategoryDto } from '@algo/types';
import { toast } from 'sonner';

// Response type for paginated categories
interface CategoriesResponse {
  items: CategoryDto[];
  total: number;
  page: number;
  limit: number;
}

const CATEGORIES_QUERY_KEY = ['categories'];

export function useCategories() {
  const queryClient = useQueryClient();

  // Query: Fetch all categories (paginated)
  const categoriesQuery = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: () => apiClient<CategoriesResponse>('/categories?limit=500'), // Get all for dropdown
    select: (data) => {
      // Handle both old (array) and new (paginated) response formats
      if (Array.isArray(data)) return data;
      if (data && 'items' in data) return data.items;
      return [];
    },
    refetchOnMount: 'always',
    staleTime: 30 * 1000,
  });

  // Mutation: Create category
  const createMutation = useMutation({
    mutationFn: (name: string) =>
      apiClient<CategoryDto>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create category');
    },
  });

  // Mutation: Update category
  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      apiClient<CategoryDto>(`/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update category');
    },
  });

  // Mutation: Delete category
  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient(`/categories/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete category');
    },
  });

  return {
    // Query state
    categories: categoriesQuery.data ?? [],
    isLoading: categoriesQuery.isLoading,
    isError: categoriesQuery.isError,
    error: categoriesQuery.error,
    refetch: categoriesQuery.refetch,

    // Mutations
    createCategory: createMutation.mutate,
    isCreating: createMutation.isPending,

    updateCategory: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    deleteCategory: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
