'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductWithCategoryDto } from '@algo/types';
import { useAdjustStock, AdjustStockRequest } from '@/hooks/use-inventory';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/ui/select';
import { Loader2, Scale, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

// Adjustment reasons
const ADJUSTMENT_REASONS = [
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'THEFT', label: 'Theft' },
  { value: 'COUNT_ERROR', label: 'Count Error' },
  { value: 'OTHER', label: 'Other' },
] as const;

// Validation schema
const adjustStockSchema = z.object({
  actualStock: z.coerce.number().min(0, 'Stock cannot be negative'),
  reason: z.enum(['DAMAGED', 'EXPIRED', 'THEFT', 'COUNT_ERROR', 'OTHER']),
  remarks: z.string().optional(),
});

type AdjustStockFormData = z.infer<typeof adjustStockSchema>;

interface AdjustStockDialogProps {
  product: ProductWithCategoryDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdjustStockDialog({ product, open, onOpenChange }: AdjustStockDialogProps) {
  // Extract productId to prevent stale hook issues
  const productId = product?.id ?? '';
  const { mutate: adjustStock, isPending } = useAdjustStock(productId);
  const currentStock = product?.stock ?? 0;

  const form = useForm<AdjustStockFormData>({
    resolver: zodResolver(adjustStockSchema) as any,
    defaultValues: {
      actualStock: currentStock,
      reason: 'COUNT_ERROR',
      remarks: '',
    },
  });

  // Watch actual stock for live difference calculation
  const actualStock = useWatch({ control: form.control, name: 'actualStock' });
  const difference = (actualStock || 0) - currentStock;

  const onSubmit = (data: AdjustStockFormData) => {
    adjustStock(
      {
        actualStock: data.actualStock,
        reason: data.reason,
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

  const getDifferenceDisplay = () => {
    if (difference === 0) return <span className="text-muted-foreground">0</span>;
    const color = difference > 0 ? 'text-green-600' : 'text-red-600';
    const Icon = difference > 0 ? ArrowUp : ArrowDown;
    return (
      <div className={cn('flex items-center gap-1 font-bold', color)}>
        <Icon className="h-3.5 w-3.5" />
        <span>{Math.abs(difference)}</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] gap-0 py-4 px-0 overflow-hidden">
        <DialogHeader className="p-5 pb-4 border-b bg-muted/20">
          <div className="flex items-center justify-between mb-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold tracking-tight">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <Scale className="h-4 w-4 text-primary" />
              </div>
              Stock Adjustment
            </DialogTitle>
            <div className="flex flex-col items-end bg-background border px-2 py-1 rounded-md shadow-sm">
              <span className="text-[10px] uppercase font-bold text-muted-foreground leading-none mb-0.5">
                System Stock
              </span>
              <span className="text-sm font-black text-foreground leading-none">
                {currentStock}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-baseleading-tight text-foreground pr-2">{product?.name}</h3>
          <DialogDescription className="sr-only">
            Adjust stock for {product?.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-5 py-2 space-y-5">
          {/* Adjustment Calculation Grid */}
          <div className="grid grid-cols-2 gap-5 items-end">
            <div className="space-y-2">
              <Label
                htmlFor="actualStock"
                className="text-xs font-bold uppercase text-muted-foreground tracking-wide"
              >
                Actual Count
              </Label>
              <Input
                id="actualStock"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...form.register('actualStock')}
                autoFocus
                className="h-10 text-base font-semibold border-primary/20 focus-visible:ring-primary/20"
              />
            </div>

            <div className="bg-muted/40 h-10 rounded-lg border border-dashed flex items-center justify-between px-4">
              <span className="text-[10px] uppercase font-bold text-muted-foreground/70">
                Difference
              </span>
              <div className="text-base font-mono tracking-tight">{getDifferenceDisplay()}</div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="reason"
                className="text-xs font-bold uppercase text-muted-foreground tracking-wide"
              >
                Reason
              </Label>
              <Select
                value={form.watch('reason')}
                onValueChange={(val) => form.setValue('reason', val as any)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                placeholder="Explanation for the adjustment..."
                {...form.register('remarks')}
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 py-0">
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
              disabled={isPending || difference === 0}
              className="flex-2 text-xs font-bold uppercase tracking-wide bg-orange-600 hover:bg-orange-700 text-white shadow-md"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Scale className="h-4 w-4 mr-2" />
              )}
              {difference === 0 ? 'No Change' : 'Apply Adjustment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
