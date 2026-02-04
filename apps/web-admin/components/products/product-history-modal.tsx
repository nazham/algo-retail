'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { ProductHistoryTab } from '../inventory/product-history-tab';
import { ProductAuditTab } from './product-audit-tab';
import { ProductWithCategoryDto } from '@algo/types';
import { Package, History as HistoryIcon } from 'lucide-react';

interface ProductHistoryModalProps {
  product: ProductWithCategoryDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProductHistoryModal({ product, open, onOpenChange }: ProductHistoryModalProps) {
  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[600px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <HistoryIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <DialogTitle>Product History</DialogTitle>
              <DialogDescription>
                Tracking movements and changes for{' '}
                <span className="font-semibold text-foreground">{product.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 pb-6">
          <Tabs defaultValue="inventory" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="inventory" className="flex items-center gap-2">
                <Package className="h-4 w-4" /> Stock Ledger
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <HistoryIcon className="h-4 w-4" /> Metadata Audit
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="inventory" className="mt-0 h-full overflow-y-auto">
                <ProductHistoryTab productId={product.id} />
              </TabsContent>

              <TabsContent value="audit" className="mt-0 h-full overflow-y-auto">
                <ProductAuditTab productId={product.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
