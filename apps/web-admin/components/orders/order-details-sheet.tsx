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
      <SheetContent className="w-[400px] sm:w-[540px]">
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
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex justify-between items-start text-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-muted-foreground">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                          {(item.discountAmount ?? 0) > 0 && (
                            <span className="text-destructive ml-1">
                              (- {formatCurrency(item.discountAmount!)})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-medium text-right">
                        {formatCurrency(
                          item.quantity * ((item.unitPrice || 0) - (item.discountAmount || 0)),
                        )}
                      </div>
                    </div>
                  ))}
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.taxTotal)}</span>
              </div>
              {(order.discountTotal ?? 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>- {formatCurrency(order.discountTotal)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Payment Method</span>
                <span className="uppercase">{order.paymentMethod?.replace('_', ' ')}</span>
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
