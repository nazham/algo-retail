'use client';

import { ProductGrid } from '@/components/products/product-grid';
import { ProductFormDialog } from '@/components/products/product-form-dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Upload } from 'lucide-react';
import Link from 'next/link';

import { DashboardContainer } from '@/components/dashboard-container';

export default function ProductsPage() {
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
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/dashboard/products/upload">
              <Upload className="h-4 w-4" />
              Bulk Upload
            </Link>
          </Button>
          <ProductFormDialog />
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {/* The Excel-Like Product Grid */}
        <ProductGrid />
      </div>
    </DashboardContainer>
  );
}
