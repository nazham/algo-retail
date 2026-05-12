import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@repo/ui/components/ui/dialog';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Checkbox } from '@repo/ui/components/ui/checkbox';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import type { OrderDto, PartialRefundDto } from '@algo/types';
import { usePartialRefund } from '../hooks/use-partial-refund';

interface PartialRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDto | null;
  onRefundSuccess: () => void;
}

interface ItemState {
  checked: boolean;
  refundQty: number;
}

export function PartialRefundModal({
  isOpen,
  onClose,
  order,
  onRefundSuccess,
}: PartialRefundModalProps) {
  const [adminPin, setAdminPin] = useState('');
  const [reason, setReason] = useState('');
  const [itemStates, setItemStates] = useState<Record<string, ItemState>>({});

  const { submitPartialRefund, isLoading } = usePartialRefund({
    onSuccess: () => {
      onRefundSuccess();
      onClose();
    },
  });

  // Initialize state on mount or order change
  useEffect(() => {
    if (isOpen && order) {
      setAdminPin('');
      setReason('');

      const initialStates: Record<string, ItemState> = {};
      order.items.forEach((item) => {
        initialStates[item.productId] = {
          checked: false,
          refundQty: item.quantity,
        };
      });
      setItemStates(initialStates);
    }
  }, [isOpen, order]);

  // Calculate Subtotal
  const refundSubtotal = useMemo(() => {
    if (!order) return 0;
    let total = 0;
    order.items.forEach((item) => {
      const state = itemStates[item.productId];
      if (state?.checked) {
        total += state.refundQty * item.unitPrice;
      }
    });
    return total;
  }, [order, itemStates]);

  const hasCheckedItems = Object.values(itemStates).some((state) => state.checked);
  const isSubmitDisabled = !hasCheckedItems || !adminPin || isLoading;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || isSubmitDisabled) return;

    const payload: PartialRefundDto = {
      originalOrderId: order.id,
      adminPin,
      reason,
      items: order.items
        .filter((item) => itemStates[item.productId]?.checked)
        .map((item) => ({
          productId: item.productId,
          quantity: itemStates[item.productId]!.refundQty,
        })),
    };

    await submitPartialRefund(payload);
  };

  const toggleCheck = (productId: string) => {
    setItemStates((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        checked: !prev[productId]?.checked,
      },
    }));
  };

  const updateQty = (productId: string, delta: number, maxQty: number) => {
    setItemStates((prev) => {
      const current = prev[productId]?.refundQty || 1;
      const next = Math.max(1, Math.min(maxQty, current + delta));
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          refundQty: next,
        },
      };
    });
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-primary">Process Itemized Refund</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select items and adjust quantities for a partial refund. This will create a partial
            mirror order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConfirm} className="space-y-6 py-4">
          <ScrollArea className="h-[300px] border border-border rounded-md">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 w-12"></th>
                  <th className="px-4 py-3">ITEM NAME</th>
                  <th className="px-4 py-3 text-right">PRICE</th>
                  <th className="px-4 py-3 text-center">QTY</th>
                  <th className="px-4 py-3 text-center">REFUND QTY</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const state = itemStates[item.productId];
                  const isChecked = state?.checked || false;
                  const qty = state?.refundQty || 1;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-center">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleCheck(item.productId)}
                          aria-label={`Select ${item.productName}`}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.productName}</td>
                      <td className="px-4 py-3 text-right">
                        Rs. {(item.unitPrice / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantity}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQty(item.productId, -1, item.quantity)}
                            disabled={!isChecked || qty <= 1}
                            aria-label={`Decrease refund quantity for ${item.productName}`}
                          >
                            <span className="text-xs">-</span>
                          </Button>
                          <span className="w-6 text-center tabular-nums">{qty}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQty(item.productId, 1, item.quantity)}
                            disabled={!isChecked || qty >= item.quantity}
                            aria-label={`Increase refund quantity for ${item.productName}`}
                          >
                            <span className="text-xs">+</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>

          <div className="flex justify-end items-center px-4 py-2 bg-muted/30 rounded-md">
            <span className="font-semibold mr-2 text-foreground">Refund Subtotal:</span>
            <span className="font-bold text-primary text-lg">
              Rs. {(refundSubtotal / 100).toFixed(2)}
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminPin">ADMIN PIN</Label>
              <Input
                id="adminPin"
                type="password"
                placeholder="Enter Admin PIN"
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">REFUND REASON</Label>
              <Input
                id="reason"
                type="text"
                placeholder="e.g. Customer requested refund"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="default" disabled={isSubmitDisabled}>
              {isLoading ? 'Processing...' : 'Confirm Partial Refund'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
