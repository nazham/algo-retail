import { X, Printer } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import type { OrderDto } from '@algo/types';
import { formatCurrency } from '../../../lib/utils';
import { useEffect } from 'react';
import { usePrintReceipt } from '../hooks/use-print-receipt';

type OrderDetailsDialogProps = {
  order: OrderDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  const { printFromOrder } = usePrintReceipt();

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onOpenChange]);

  if (!open || !order) return null;

  const handlePrint = async () => {
    await printFromOrder(order);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity print:hidden"
        onClick={() => onOpenChange(false)}
      />

      {/* RECEIPT CARD 
         - Modeled after the "Thermal Printer" width (~80mm)
         - font-mono is crucial for the receipt look
      */}
      <div className="relative z-50 bg-white w-full max-w-90 shadow-2xl animate-in fade-in zoom-in-95 rounded-sm flex flex-col max-h-[90vh] print:shadow-none print:w-auto print:max-w-none print:max-h-none print:fixed print:inset-0 print:flex print:justify-center print:pt-0">
        {/* SCROLLABLE CONTENT AREA */}
        <div className="overflow-y-auto p-4 text-black font-mono leading-tight print:overflow-visible print:p-0 print:w-[76mm] print:mx-auto">
          {/* --- HEADER --- 
          <div className="text-center border-b-2 border-black pb-3 mb-3">
            <h1 className="text-[18px] font-bold tracking-wide mb-2 uppercase">Algo Retail</h1>
            <div className="text-[10px] space-y-0.5 leading-snug">
              <p>123 Market St</p>
              <p>Colombo, Sri Lanka</p>
              <p>Tel: 077-1234567 / 032-1234567</p>
              <p>Email: info@algoretail.com</p>
            </div>
          </div>
*/}
          {/* --- METADATA --- */}
          <div className="mb-3 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span>#{order.orderNumber || order.id.slice(0, 8)}</span>
              <span>
                {new Date(order.createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Customer: Walk-in</span>
              <span>Cashier: Admin</span>
            </div>
          </div>

          {/* --- DIVIDER --- */}
          <div className="border-t border-dashed border-gray-500 my-3"></div>

          {/* --- ITEMS TABLE (Refactored to 2-row style) --- */}
          <table className="w-full text-left border-collapse mb-2">
            <tbody className="divide-y divide-dashed divide-gray-200">
              {order.items.map((item, idx) => (
                // Using a fragment or multiple rows per item
                // NOTE: We wrap these in a tbody for valid HTML structure if we want spacing,
                // but standard tables don't support nested borders well on rows.
                // We will use a flat list logic or simple rows.
                <>
                  <tr key={`${idx}-name`} className="border-none">
                    <td colSpan={3} className="pt-2 pb-0.5 font-bold text-[11px]">
                      {item.productName}
                    </td>
                  </tr>
                  <tr
                    key={`${idx}-details`}
                    className="border-b border-dashed border-gray-300 last:border-0"
                  >
                    <td className="pb-2 text-[10px] text-gray-600">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </td>
                    <td></td>
                    <td className="pb-2 text-[10px] text-right font-medium">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </td>
                  </tr>
                  {(item.discountAmount ?? 0) > 0 && (
                    <tr key={`${idx}-discount`}>
                      <td colSpan={2} className="pb-1 text-[10px] text-green-600 italic">
                        Discount ({item.discountType ?? 'Manual'})
                      </td>
                      <td className="pb-1 text-[10px] text-right text-green-600">
                        - {formatCurrency(item.discountAmount ?? 0)}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {/* --- TOTALS --- */}
          <div className="border-t border-black pt-2 mt-2 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>

            {order.discountTotal > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Discount:</span>
                <span>- {formatCurrency(order.discountTotal)}</span>
              </div>
            )}

            {/* Grand Total - Double Border Style Simulation */}
            <div className="flex justify-between text-[14px] font-bold border-t-4 border-double border-black pt-2 mt-2">
              <span>TOTAL:</span>
              <span>{formatCurrency(order.grandTotal)}</span>
            </div>

            {/* Payment Info */}
            <div className="text-right pt-2 text-[11px] leading-snug">
              <p>Payment: {order.paymentMethod}</p>
              {/* If you have tendered/change data, render it here */}
              <p>Received: {formatCurrency(order.grandTotal)}</p>
            </div>
          </div>

          {/* --- FOOTER --- 
          <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-500">
            <p className="text-[14px] font-bold mb-2">Thank You!</p>
            <p className="text-[9px] leading-snug text-gray-800 mb-2">
              RETURN POLICY: Items may be returned within 7 days with original receipt. Clearance
              items are final sale.
            </p>
            <p className="text-[9px] text-gray-500">Powered by AlgoRetail POS</p>
          </div>
          */}
        </div>

        {/* --- ACTIONS (Hidden on print) --- */}
        <div className="bg-gray-50 p-3 border-t flex gap-2 print:hidden shrink-0 rounded-b-sm">
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
            onClick={handlePrint}
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

// TODO: Change the commented out static data into Dynamic
