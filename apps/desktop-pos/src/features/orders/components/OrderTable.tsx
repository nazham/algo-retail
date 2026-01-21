import { useState, useEffect } from 'react';
import type { OrderDto } from '@algo/types';
import { Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { TableHeader, PaymentBadge, StatusBadge, OrderActionsMenu } from './ui';
import { OrderDetailsDialog } from './OrderDetailsDialog';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '@repo/ui/components/ui/button';
/*import LocalDateTime from './LocalDateTime';*/

type OrderTableProps = {
  orders: OrderDto[];
};

const ITEMS_PER_PAGE = 10;

export function OrderTable({ orders }: OrderTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [orders]);

  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentOrders = orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const toggleMenu = (id: string) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handleViewDetails = (order: OrderDto) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <>
      {/* 👇 CHANGED: Removed 'flex-1 overflow-hidden', added 'h-fit' */}
      <div className="bg-card rounded-xl shadow-sm border flex flex-col h-fit">
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
                  <td
                    colSpan={7}
                    className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2"
                  >
                    <Wallet size={40} className="text-muted-foreground/50" />
                    <span>No transactions recorded yet.</span>
                  </td>
                </tr>
              ) : (
                currentOrders.map((order) => (
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
                      <PaymentBadge type="Cash" />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-4 text-right">
                      <OrderActionsMenu
                        orderId={order.id}
                        activeMenu={activeMenu}
                        toggleMenu={toggleMenu}
                        onViewDetails={() => handleViewDetails(order)}
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
              Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{' '}
              <span className="font-medium text-foreground">
                {Math.min(startIndex + ITEMS_PER_PAGE, orders.length)}
              </span>{' '}
              of <span className="font-medium text-foreground">{orders.length}</span> results
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
    </>
  );
}
