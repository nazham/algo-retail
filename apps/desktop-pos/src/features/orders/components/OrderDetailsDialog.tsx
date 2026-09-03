import React from 'react';
import { X, Printer } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import type { OrderDto } from '@algo/types';
import { formatCurrency, formatAmount } from '../../../lib/utils';
import { useEffect } from 'react';
import { usePrintReceipt } from '../hooks/use-print-receipt';
import { useStoreSettingsStore } from '../../../stores/store-settings.store';

type OrderDetailsDialogProps = {
  order: OrderDto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDetailsDialog({ order, open, onOpenChange }: OrderDetailsDialogProps) {
  const { printFromOrder } = usePrintReceipt();
  const storeConfig = useStoreSettingsStore((state) => state.storeConfig);

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
          {/* --- HEADER --- */}
          <div className="text-center mb-4">
            <h1 className="text-[20px] font-bold tracking-tight mb-1">
              {storeConfig?.name || 'Algo Retail'}
            </h1>
            <div className="text-[10px] space-y-0.5 leading-snug">
              <p>{storeConfig?.addressLine1}</p>
              <p>{storeConfig?.addressLine2}</p>
              <p>
                {storeConfig?.phone1 && `Tel: ${storeConfig.phone1}`}
                {storeConfig?.phone2 && ` / ${storeConfig.phone2}`}
              </p>
            </div>
          </div>

          <div className="border-t-2 border-black mb-3"></div>
          {/* --- METADATA --- */}
          <div className="mb-3 text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="font-bold">#{order.orderNumber || order.id.slice(0, 8)}</span>
              <span>
                {new Date(order.createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Customer: Walk-in</span>
              <span>Cashier: Admin</span>
            </div>
          </div>

          <div className="border-t border-dashed border-gray-500 mb-2"></div>

          {/* --- ITEMS TABLE --- */}
          <table className="w-full text-[10px] mb-2 border-collapse">
            <thead>
              <tr className="uppercase font-bold">
                <th className="text-center w-[15%] py-1">QTY</th>
                <th className="text-left w-[35%] py-1">MRP</th>
                <th className="text-center w-[20%] py-1">Price</th>
                <th className="text-right w-[30%] py-1">TOTAL</th>
              </tr>
              <tr>
                <td colSpan={4} className="border-t border-dashed border-gray-500"></td>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => {
                const effectiveUnitPrice = (item.unitPrice ?? 0) - (item.discountAmount ?? 0);
                const lineTotal = item.quantity * effectiveUnitPrice;
                return (
                  <React.Fragment key={idx}>
                    <tr>
                      <td colSpan={4} className="pt-2 pb-1 font-bold text-[11px]">
                        {item.productName}
                      </td>
                    </tr>
                    <tr className="border-b border-dashed border-gray-200 last:border-0">
                      <td className="text-center pb-2">{item.quantity}</td>
                      <td className="pb-2">{formatAmount(item.unitPrice)}</td>
                      <td className="text-center pb-2">{formatAmount(effectiveUnitPrice)}</td>
                      <td className="text-right pb-2 font-medium">{formatAmount(lineTotal)}</td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          <div className="border-t-2 border-black mb-2"></div>

          {/* --- TOTALS --- */}
          <table className="w-full text-[11px] mb-2 border-collapse">
            <tbody>
              <tr>
                <td className="py-1">Subtotal:</td>
                <td className="text-right py-1 font-medium">{formatCurrency(order.subtotal)}</td>
              </tr>
              {(order.taxTotal ?? 0) > 0 && (
                <tr>
                  <td className="py-1">Tax:</td>
                  <td className="text-right py-1 font-medium">
                    {formatCurrency(order.taxTotal ?? 0)}
                  </td>
                </tr>
              )}
              {(order.discountTotal ?? 0) > 0 && (
                <tr>
                  <td className="py-1">Discount:</td>
                  <td className="text-right py-1 font-medium">
                    - {formatCurrency(order.discountTotal)}
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={2} className="border-t-2 border-black pt-2 pb-1">
                  <div className="flex justify-between text-[16px] font-bold">
                    <span>TOTAL:</span>
                    <span>{formatCurrency(order.grandTotal)}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Payment Info */}
          <div className="text-right space-y-1 text-[11px] mb-4">
            <p>Payment: {order.paymentMethod || 'CASH'}</p>
            <p>Received: {formatCurrency(order.grandTotal)}</p>
          </div>

          <div className="border-t border-dashed border-gray-500 pt-4 text-center">
            <p className="text-[14px] font-bold uppercase mb-4 tracking-tight">
              Thank You For Your Purchase!
            </p>
            <p className="text-[8px] leading-relaxed text-center uppercase text-gray-700">
              RETURN POLICY: RETURNS ACCEPTED WITHIN 7 DAYS WITH ORIGINAL RECEIPT. PERISHABLE, FOOD,
              HYGIENE, CLEARANCE, AND OPENED ITEMS ARE NON-RETURNABLE. DEFECTIVE OR EXPIRED ITEMS
              MUST BE REPORTED WITHIN 24 HOURS. REFUNDS ISSUED TO ORIGINAL PAYMENT METHOD.
            </p>
          </div>
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
