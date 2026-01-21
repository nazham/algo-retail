import { Button } from '@repo/ui/components/ui/button';
import { RotateCcw, X, Trash2 } from 'lucide-react';
import type { HeldOrder } from '../../../stores/cart.store';

interface RecallOrderModalProps {
  isOpen: boolean;
  setIsRecallOpen: (isOpen: boolean) => void;
  heldOrders: HeldOrder[];
  handleRestore: (orderId: string) => void;
  discardHeldOrder: (orderId: string) => void;
}

export default function RecallOrderModal(props: RecallOrderModalProps) {
  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-10">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-background">
          <h2 className="font-bold flex items-center gap-2 text-foreground">
            <RotateCcw className="w-5 h-5" /> Recall Held Order
          </h2>
          <Button variant="ghost" size="icon" onClick={() => props.setIsRecallOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
          {props.heldOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-10">No held orders found.</div>
          ) : (
            props.heldOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-3 hover:bg-accent transition-colors flex justify-between items-center"
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => props.handleRestore(order.id)}
                >
                  <div className="flex gap-3 text-sm font-bold mb-1">
                    <span>Order #{order.id.slice(-4)}</span>
                    <span className="text-gray-500 font-normal">
                      {new Date(order.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {order.items.length} items • Rs. {(order.total / 100).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 truncate max-w-md">
                    {order.items.map((i) => i.name).join(', ')}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button size="sm" onClick={() => props.handleRestore(order.id)}>
                    Restore
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => props.discardHeldOrder(order.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
