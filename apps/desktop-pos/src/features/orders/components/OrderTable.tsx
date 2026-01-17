import { useState } from 'react';
import type { OrderDto } from '@algo/types';
import { Wallet } from 'lucide-react';
// Imports should work fine now that ui.tsx is fixed
import { TableHeader, PaymentBadge, StatusBadge, OrderActionsMenu } from './ui';
import { OrderDetailsDialog } from './OrderDetailsDialog'; // Ensure this file exists
import { formatCurrency, formatDate } from '../lib/utils';

type OrderTableProps = {
  orders: OrderDto[];
};

export function OrderTable({ orders }: OrderTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // --- New State ---
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const toggleMenu = (id: string) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  // --- Handler ---
  const handleViewDetails = (order: OrderDto) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  return (
    <>
      <div className="bg-card rounded-xl shadow-sm border flex-1 overflow-hidden flex flex-col">
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
                      <PaymentBadge type="Cash" />
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-4 text-right">
                      {/* --- Update this component call --- */}
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
      </div>

      {/* --- Dialog rendered here --- */}
      <OrderDetailsDialog
        order={selectedOrder}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </>
  );
}
