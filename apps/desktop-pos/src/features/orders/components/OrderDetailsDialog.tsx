import { X, Printer } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import type { OrderDto } from '@algo/types';
import { formatCurrency } from '../lib/utils';
import { useEffect } from 'react';

type OrderDetailsDialogProps = {
  order: OrderDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  if (!open || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity print:hidden"
        onClick={() => onOpenChange(false)}
      />

      {/* RECEIPT CARD 
         - w-full max-w-[380px]: Standard receipt width.
         - height is AUTOMATIC (h-fit). It grows with content.
         - max-h-[90vh]: Prevents it from being taller than the screen.
      */}
      <div className="relative z-50 bg-white w-full max-w-[380px] shadow-2xl animate-in fade-in zoom-in-95 rounded-sm flex flex-col max-h-[90vh] print:shadow-none print:w-auto print:max-w-none print:max-h-none print:fixed print:inset-0 print:flex print:justify-center print:pt-4">
        {/* SCROLLABLE CONTENT AREA 
           - overflow-y-auto: Only scrolls if content exceeds screen height.
        */}
        <div className="overflow-y-auto p-6 text-sm font-mono text-black print:overflow-visible print:p-4 print:border-2 print:border-black print:w-[80mm] print:mx-auto">
          {/* --- HEADER --- */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase tracking-widest mb-1">Algo Retail</h1>
            <p className="text-[10px] text-gray-500 uppercase">POS Terminal #01</p>
            <p className="text-[10px] text-gray-500">123 Market St, Colombo</p>
            <div className="mt-4 border-b-2 border-dashed border-black"></div>
          </div>

          {/* --- META DATA --- */}
          <div className="mb-6 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-500">Order ID:</span>
              <span className="font-bold">#{order.orderNumber || order.id.slice(0, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date:</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* --- ITEMS TABLE --- */}
          <div className="mb-6">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dashed border-black">
                  <th className="pb-1 font-bold text-[11px] w-[45%]">Item</th>
                  <th className="pb-1 font-bold text-[11px] text-center w-[20%]">Qty</th>
                  <th className="pb-1 font-bold text-[11px] text-right w-[35%]">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dashed divide-gray-200">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 pr-2">
                      <div className="font-bold text-[11px] leading-tight">{item.productName}</div>
                    </td>
                    <td className="py-2 text-center align-top text-[11px]">{item.quantity}</td>
                    <td className="py-2 text-right align-top text-[11px]">
                      {formatCurrency(item.price * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --- TOTALS --- */}
          <div className="space-y-1 border-t-2 border-dashed border-black pt-3 mb-6">
            <div className="flex justify-between text-[11px]">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subTotal || order.grandTotal * 0.9)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span>Tax (10%)</span>
              <span>{formatCurrency(order.tax || order.grandTotal * 0.1)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold border-t-2 border-black pt-2 mt-2">
              <span>TOTAL</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>
          </div>

          {/* --- FOOTER --- */}
          <div className="text-center text-[10px] text-gray-500">
            <p className="font-bold text-black">Thank you!</p>
            <div className="mt-2 opacity-50 font-mono">System by Algo Retail</div>
          </div>
        </div>

        {/* ACTION BUTTONS (Sticky at bottom, hidden on print) */}
        <div className="bg-gray-50 p-3 border-t flex gap-2 print:hidden shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-black hover:bg-gray-800 text-white h-9"
            onClick={() => window.print()}
          >
            <Printer className="w-3 h-3 mr-2" />
            Print
          </Button>
        </div>

        {/* CLOSE X BUTTON */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-2 top-2 p-1.5 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors print:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
