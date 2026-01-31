'use client';

import { ProductGrid } from '@/components/products/product-grid';
import { Button } from '@repo/ui/components/ui/button';
import { Download, Upload, Plus } from 'lucide-react';
import Link from 'next/link';

export default function ProductsPage() {
  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-8 animate-in fade-in duration-500">
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Product
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* The Excel-Like Product Grid */}
        <ProductGrid />
      </div>
    </div>
  );
}
