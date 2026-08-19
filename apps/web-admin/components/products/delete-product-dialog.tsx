'use client';

import { useDeleteCheck, useProducts } from '@/hooks/use-products';
import { ProductWithCategoryDto } from '@algo/types';
import { Button } from '@repo/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { AlertTriangle, Info, Loader2, Trash2 } from 'lucide-react';

interface DeleteProductDialogProps {
  product: ProductWithCategoryDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteProductDialog({
  product,
  open,
  onOpenChange,
  onSuccess,
}: DeleteProductDialogProps) {
  const { data: checkData, isLoading: isLoadingCheck } = useDeleteCheck(product?.id || null, open);
  const { deleteProductAsync, isDeleting } = useProducts({ enabled: false });

  const handleDelete = async () => {
    if (!product) return;
    try {
      await deleteProductAsync(product.id);
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      // Error toast already handled by hook
    }
  };

  const hasTransactions = checkData?.hasTransactions ?? false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-120">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <div className="p-2 rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <DialogTitle>Delete Product</DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">{product?.name}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-3">
          {isLoadingCheck ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-2 border rounded-lg bg-muted/20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Checking transaction history...</p>
            </div>
          ) : hasTransactions ? (
            <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-400">
                    Dependencies Warning
                  </h4>
                  <p className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    This product is linked to{' '}
                    <strong className="font-semibold">{checkData?.transactionCount}</strong>{' '}
                    dependencies ({checkData?.orderCount ?? 0} order item(s),{' '}
                    {checkData?.movementCount ?? 0} inventory movement(s), and{' '}
                    {checkData?.batchCount ?? 0} child batch(es)).
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400/80 leading-relaxed pt-1">
                    To preserve dependencies and financial audit history, this product will be
                    safely <strong className="font-semibold">deactivated & soft-deleted</strong>{' '}
                    rather than permanently removed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">No Transactions Found</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This product has no transaction history (no sales or stock movements). It will
                    be{' '}
                    <strong className="font-semibold text-foreground">permanently deleted</strong>{' '}
                    from your database.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={hasTransactions ? 'default' : 'destructive'}
            className={hasTransactions ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
            onClick={handleDelete}
            disabled={isDeleting || isLoadingCheck}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {hasTransactions ? 'Deactivate & Soft-Delete' : 'Permanently Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
