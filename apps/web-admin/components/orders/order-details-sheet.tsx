'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/ui/sheet';
import { Badge } from '@repo/ui/components/ui/badge';
import { Separator } from '@repo/ui/components/ui/separator';
import { ScrollArea } from '@repo/ui/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useOrder } from '@/hooks/use-orders';
import { formatCurrency } from '@/lib/utils';

interface OrderDetailsSheetProps {
  orderId: string | null;
  onClose: () => void;
}

export function OrderDetailsSheet({ orderId, onClose }: OrderDetailsSheetProps) {
  const { data: order, isLoading } = useOrder(orderId);

  return (
    <Sheet open={!!orderId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-135">
        <SheetHeader>
          <SheetTitle>Order Details</SheetTitle>
          <SheetDescription>View transaction details and items.</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : order ? (
          <div className="flex flex-col h-full pb-10">
            <div className="flex items-center justify-between py-4">
              <div>
                <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
                </p>
              </div>
              <Badge
                variant={
                  order.status === 'COMPLETED'
                    ? 'success'
                    : order.status === 'REFUNDED'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {order.status}
              </Badge>
            </div>

            <Separator />

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="py-4 space-y-4">
                {/* Items */}
                <div className="divide-y divide-border/40">
                  {order.items?.map((item, index) => {
                    const discountAmt = item.discountAmount ?? 0;
                    const hasDiscount = discountAmt > 0;
                    const unitPrice = item.unitPrice ?? 0;
                    const grossLineTotal = unitPrice * item.quantity;
                    const netLineTotal = (unitPrice - discountAmt) * item.quantity;
                    const totalLineDiscount = discountAmt * item.quantity;

                    return (
                      <div
                        key={item.id || index}
                        className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1.5"
                      >
                        {/* ROW 1: Name & Net Total (+ strikethrough gross if discount) */}
                        <div className="flex justify-between items-start gap-3">
                          <div className="font-medium text-sm text-foreground line-clamp-2 leading-snug flex-1">
                            {item.productName}
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-semibold text-sm text-foreground whitespace-nowrap leading-none">
                              {formatCurrency(netLineTotal)}
                            </div>
                            {hasDiscount && (
                              <div className="text-[11px] text-muted-foreground line-through mt-0.5 whitespace-nowrap font-mono">
                                {formatCurrency(grossLineTotal)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ROW 2: Derivation Equation + Total Discount Badge */}
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono leading-none">
                          {/* Left: formula */}
                          <div className="flex items-center flex-wrap gap-x-1 gap-y-0.5 text-muted-foreground">
                            {hasDiscount ? (
                              <>
                                {item.quantity > 1 && (
                                  <span className="text-muted-foreground/60">(</span>
                                )}
                                <span>{formatCurrency(unitPrice)}</span>
                                <span className="text-muted-foreground/60 px-0.5">−</span>
                                <span className="text-green-600 dark:text-green-400">
                                  {formatCurrency(discountAmt)}
                                </span>
                                {item.quantity > 1 && (
                                  <>
                                    <span className="text-muted-foreground/60">)</span>
                                    <span className="text-muted-foreground/60 px-0.5">×</span>
                                    <span>{item.quantity}</span>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <span>{formatCurrency(unitPrice)}</span>
                                <span className="text-muted-foreground/60 px-0.5">×</span>
                                <span>{item.quantity}</span>
                              </>
                            )}
                          </div>

                          {/* Right: total discount badge */}
                          {hasDiscount && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
                              −{formatCurrency(totalLineDiscount)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {(order.taxTotal ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(order.taxTotal ?? 0)}</span>
                </div>
              )}
              {(order.discountTotal ?? 0) > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount</span>
                  <span>−{formatCurrency(order.discountTotal ?? 0)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Payment Method</span>
                <span className="uppercase">{order.paymentMethod?.replace(/_/g, ' ')}</span>
              </div>
              {/* Metadata */}
              <div className="mt-6 p-3 bg-muted/50 rounded-md text-[10px] text-muted-foreground font-mono">
                <div>ID: {order.id}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Order not found
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
