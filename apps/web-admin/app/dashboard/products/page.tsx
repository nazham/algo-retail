'use client';

import { useState } from 'react';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductFormDialog } from '@/components/products/product-form-dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Upload, Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient, useIsFetching } from '@tanstack/react-query';

import { DashboardContainer } from '@/components/dashboard-container';
import { ProductWithCategoryDto } from '@algo/types';

export default function ProductsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategoryDto | undefined>(
    undefined,
  );
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ['products'] }) > 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const handleCreate = () => {
    setSelectedProduct(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: ProductWithCategoryDto) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  return (
    <DashboardContainer size="wide">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products Inventory</h1>
          <p className="text-muted-foreground mt-2">
            Manage your products, prices, and batches with the real-time grid.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/dashboard/products/upload">
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Link>
          </Button>
          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {/* The Excel-Like Product Grid */}
        <ProductGrid onEdit={handleEdit} />
      </div>

      {/* Shared Create/Edit Dialog */}
      <ProductFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
      />
    </DashboardContainer>
  );
}
