import { useState } from 'react';
import { useOrders } from '../features/orders/hooks/use-orders';
import { OrderPageLayout } from '../features/orders/components/OrderPageLayout';
import { Loader2, AlertCircle } from 'lucide-react';

export default function OrderPage() {
  const { orders, isLoading, error } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);

  // Handle the case where user types "#" in the search, matching the display format
  const normalizedSearchTerm = searchTerm.startsWith('#') ? searchTerm.substring(1) : searchTerm;

  const filteredOrders = orders
    .filter((order) => order.orderNumber.toLowerCase().includes(normalizedSearchTerm.toLowerCase()))
    .filter((order) => {
      if (!date) return true;
      const orderDate = new Date(order.createdAt);
      return orderDate.toDateString() === date.toDateString();
    });

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="animate-spin" size={32} />
        <p>Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-destructive gap-3">
        <AlertCircle size={32} />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <OrderPageLayout
      orders={filteredOrders}
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      // date={date}
      setDate={setDate}
    />
  );
}
