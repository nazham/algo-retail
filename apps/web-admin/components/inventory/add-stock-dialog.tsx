'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductWithCategoryDto } from '@algo/types';
import { useAddStock } from '@/hooks/use-inventory';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Loader2, Package } from 'lucide-react';

// Validation schema
const addStockSchema = z.object({
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  costPrice: z.coerce.number().min(0).optional(),
  remarks: z.string().optional(),
});

type AddStockFormData = z.infer<typeof addStockSchema>;

interface AddStockDialogProps {
  product: ProductWithCategoryDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStockDialog({ product, open, onOpenChange }: AddStockDialogProps) {
  // Early return if no product - prevents stale hook issues
  const productId = product?.id ?? '';
  const { mutate: addStock, isPending } = useAddStock(productId);

  const form = useForm<AddStockFormData>({
    resolver: zodResolver(addStockSchema) as any,
    defaultValues: {
      quantity: 0,
      costPrice: product?.costPrice ? product.costPrice / 100 : 0,
      remarks: '',
    },
  });

  const onSubmit = (data: AddStockFormData) => {
    addStock(
      {
        quantity: data.quantity,
        costPrice: data.costPrice ? Math.round(data.costPrice * 100) : undefined,
        remarks: data.remarks || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          form.reset();
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] gap-0 py-3 px-1 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <Package className="h-4 w-4 text-primary" />
              </div>
              Quick Stock In
            </DialogTitle>
            <div className="flex flex-col items-end bg-background border px-2 py-1 rounded-md shadow-sm">
              <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-0.5">
                Current Stock
              </span>
              <span className="text-sm font-black text-primary leading-none">
                {product?.stock ?? 0}{' '}
                <span className="text-[10px] font-medium text-muted-foreground ml-0.5">
                  {product?.uom}
                </span>
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-base leading-tight text-foreground pr-2">
              {product?.name}
            </h3>

            {/* Compact Metadata Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              {product?.price && (
                <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-full border border-primary/5">
                  <span className="opacity-70 font-medium">MRP</span>
                  <span className="text-foreground font-bold">
                    {(product.price / 100).toFixed(2)}
                  </span>
                </span>
              )}
              <div className="flex items-center gap-3">
                {product?.brand && (
                  <span className="flex items-center gap-1">
                    <span className="opacity-60">Brand:</span>
                    <span
                      className="text-foreground font-medium max-w-[100px] truncate"
                      title={product.brand}
                    >
                      {product.brand}
                    </span>
                  </span>
                )}
                {product?.supplier && (
                  <span className="flex items-center gap-1">
                    <span className="opacity-60">Store:</span>
                    <span
                      className="text-foreground font-medium max-w-[100px] truncate"
                      title={product.supplier}
                    >
                      {product.supplier}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogDescription className="sr-only">
            Form to add stock for {product?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label
                htmlFor="quantity"
                className="text-xs font-bold uppercase text-muted-foreground tracking-wide"
              >
                Quantity to Add
              </Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register('quantity')}
                autoFocus
                className="h-10 text-base font-semibold border-primary/20 focus-visible:ring-primary/20"
              />
              {form.formState.errors.quantity && (
                <p className="text-[10px] text-destructive font-bold uppercase mt-1">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="costPrice"
                className="text-xs font-bold uppercase text-muted-foreground tracking-wide"
              >
                Unit Cost (LKR)
              </Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register('costPrice')}
                className="h-10 text-base"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="remarks"
              className="text-xs font-bold uppercase text-muted-foreground tracking-wide"
            >
              Remarks <span className="font-normal normal-case opacity-50 ml-1">(Optional)</span>
            </Label>
            <Input
              id="remarks"
              placeholder="Invoice number, batch code, or notes..."
              {...form.register('remarks')}
              className="h-10 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 text-xs font-medium"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-2 text-xs font-bold uppercase tracking-wide shadow-md"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Package className="h-4 w-4 mr-2" />
              )}
              Save to Inventory
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
