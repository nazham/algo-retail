import { useState } from 'react';
import type { OrderDto, PaymentMethod } from '@algo/types';
import { Wallet, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { TableHeader, PaymentBadge, StatusBadge, OrderActionsMenu } from './ui';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import { RefundOrderModal } from './RefundOrderModal';
import { formatCurrency, formatDate } from '../../../lib/utils';
import { Button } from '@repo/ui/components/ui/button';

type OrderTableProps = {
  orders: OrderDto[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  onRefresh?: () => void;
};

export function OrderTable({
  orders,
  currentPage,
  totalPages,
  onPageChange,
  isLoading,
  onRefresh,
}: OrderTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const toggleMenu = (id: string) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handleViewDetails = (order: OrderDto) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handleRefundClick = (orderId: string) => {
    setRefundOrderId(orderId);
    setIsRefundModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  return (
    <>
      {/* 👇 CHANGED: Removed 'flex-1 overflow-hidden', added 'h-fit' */}
      <div className="bg-card rounded-xl shadow-sm border flex flex-col h-fit relative">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {/* 👇 CHANGED: Removed 'flex-1', kept 'overflow-x-auto' for horizontal scroll only */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50 border-b">
              <tr>
                <TableHeader label="ID" />
                <TableHeader label="Date & Time" />
                <TableHeader label="Items" />
                <TableHeader label="Amount" />
                <TableHeader label="Payment" />
                <TableHeader label="Status" />
                <TableHeader label="Actions" align="right" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Wallet size={40} className="text-muted-foreground/50" />
                      <span className="">No transactions recorded yet.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors relative">
                    <td className="p-4">
                      <span className="font-mono text-primary font-medium text-sm">
                        #{order.orderNumber || order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-4 text-sm text-foreground font-medium">
                      {order.items.length > 0
                        ? `${order.items[0].productName} ${order.items.length > 1 ? `+${order.items.length - 1} more` : ''}`
                        : 'No Items'}
                    </td>
                    <td className="p-4 text-sm font-bold text-foreground">
                      {formatCurrency(order.grandTotal)}
                    </td>
                    <td className="p-4">
                      <PaymentBadge type={order.paymentMethod as PaymentMethod} />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-4 text-right">
                      <OrderActionsMenu
                        orderId={order.id}
                        order={order}
                        activeMenu={activeMenu}
                        toggleMenu={toggleMenu}
                        onViewDetails={() => handleViewDetails(order)}
                        onRefund={() => handleRefundClick(order.id)}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* --- Pagination Footer --- */}
        {orders.length > 0 && (
          <div className="border-t p-4 flex items-center justify-between bg-card">
            <div className="text-sm text-muted-foreground">
              Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
              <span className="font-medium text-foreground">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <div className="text-sm font-medium px-2">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <OrderDetailsDialog
        order={selectedOrder}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />

      <RefundOrderModal
        orderId={refundOrderId}
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        onSuccess={() => {
          setIsRefundModalOpen(false);
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
}
