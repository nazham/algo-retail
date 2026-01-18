import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useCartStore } from '../../../stores/cart.store';
import { Button } from '@repo/ui/components/ui/button';
import { toast } from 'sonner';
import type { PaymentMethod } from '@algo/types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// Sri Lankan cash denominations (in Rs)
const SL_DENOMINATIONS = [5, 10, 20, 50, 100, 500, 1000, 2000, 5000];

/**
 * Calculate smart quick amount suggestions based on total
 * Returns 6 practical amounts for faster checkout
 *
 * Example: For Rs. 1710, shows: 1710, 1720, 1750, 1800, 2000, 5000
 */
function calculateQuickAmounts(totalInCents: number): number[] {
  const totalInRs = totalInCents / 100;
  const amounts = new Set<number>();

  // 1. Always include exact amount (rounded up)
  amounts.add(Math.ceil(totalInRs));

  // 2. Calculate roundups to practical denominations
  // Round up to nearest 20, 50, 100, 500, 1000
  const roundupDenominations = [20, 50, 100, 500, 1000];

  for (const denom of roundupDenominations) {
    const roundedUp = Math.ceil(totalInRs / denom) * denom;
    if (roundedUp > totalInRs) {
      amounts.add(roundedUp);
    }
  }

  // 3. Always add 5000 as a practical large note option
  if (totalInRs < 5000) {
    amounts.add(5000);
  } else {
    // For totals > 5000, add the next 5000 multiple
    amounts.add(Math.ceil(totalInRs / 5000) * 5000);
  }

  // 4. If we still don't have 6 options, add next denominations above total
  if (amounts.size < 6) {
    for (const denom of SL_DENOMINATIONS) {
      if (denom > totalInRs && amounts.size < 6) {
        amounts.add(denom);
      }
    }
  }

  // 5. Convert to array, sort, and take the 6 most practical amounts
  return Array.from(amounts)
    .sort((a, b) => a - b)
    .slice(0, 6);
}

export function CheckoutModal({ isOpen, onClose, onComplete }: CheckoutModalProps) {
  // Local State
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cart Store
  const { items, getTotals, clearCart } = useCartStore();
  const totals = getTotals();
  const grandTotal = totals.total;

  // Dynamic quick amounts based on total
  const quickAmounts = calculateQuickAmounts(grandTotal);

  // Calculations
  const tenderedAmountCents = parseFloat(tenderedAmount || '0') * 100;
  const changeDue = tenderedAmountCents - grandTotal;

  // Validation
  const canComplete = paymentMethod === 'BANK_TRANSFER' ? true : tenderedAmountCents >= grandTotal;

  // Auto-focus & Reset on Open
  useEffect(() => {
    if (isOpen) {
      // Auto-fill exact amount for faster checkout
      const exactAmount = (grandTotal / 100).toFixed(2);
      setTenderedAmount(exactAmount);
      setPaymentMethod('CASH');
      setIsProcessing(false);

      // Focus input after modal render
      setTimeout(() => {
        inputRef.current?.focus();
        // Select all text for easy override
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, grandTotal]);

  // Keyboard Listeners
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && canComplete && !isProcessing) {
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canComplete, isProcessing]);

  // Transaction Handler
  const handleComplete = async () => {
    if (!canComplete || isProcessing) return;

    setIsProcessing(true);

    try {
      // 1. Construct Order Payload
      const orderData = {
        subtotal: totals.subtotal,
        taxTotal: totals.tax,
        discountTotal: 0,
        grandTotal: totals.total,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      // 2. Save to Database (IPC)
      const result = await window.api.invoke('orders:create', orderData);

      if (!result || !result.orderNumber) {
        throw new Error('Failed to create order');
      }

      // 3. Print Receipt (IPC) with payment details
      const printResult = await window.api.invoke('print-receipt', {
        order: {
          orderNumber: result.orderNumber,
          grandTotal: totals.total,
          paymentMethod,
        },
        items: items.map((item) => ({
          productName: item.name,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
        paymentDetails: {
          method: paymentMethod,
          tenderedAmount: tenderedAmountCents,
          changeDue: paymentMethod === 'CASH' ? changeDue : 0,
        },
      });

      if (!printResult.success) {
        console.error('Print failed:', printResult.error);
        toast.error(`Receipt print failed: ${printResult.error}`);
      } else {
        toast.success('Receipt printed successfully!');
      }

      // 4. Success - Clear Cart & Close
      toast.success(`Order #${result.orderNumber} completed!`);
      clearCart();
      onComplete();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(
        `Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);

    if (method === 'BANK_TRANSFER') {
      // Auto-set tendered amount to grand total for bank transfers
      setTenderedAmount((grandTotal / 100).toFixed(2));
    } else {
      // Focus input for cash payments
      inputRef.current?.focus();
    }
  };

  const handleQuickAmount = (amount: number) => {
    setTenderedAmount(amount.toString());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Checkout</h2>
            <p className="text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isProcessing}>
            <X size={20} />
          </Button>
        </div>

        {/* Grand Total Display */}
        <div className="p-6 text-center bg-secondary/50">
          <p className="text-sm text-muted-foreground mb-2">Total Amount</p>
          <p className="text-5xl font-bold text-primary">Rs. {(grandTotal / 100).toFixed(2)}</p>
        </div>

        {/* Payment Method Toggles */}
        <div className="p-6 space-y-4">
          <label className="text-sm font-medium text-foreground">Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
              size="lg"
              className="h-14 text-base font-semibold"
              onClick={() => handlePaymentMethodChange('CASH')}
              disabled={isProcessing}
            >
              Cash
            </Button>
            <Button
              variant={paymentMethod === 'BANK_TRANSFER' ? 'default' : 'outline'}
              size="lg"
              className="h-14 text-base font-semibold"
              onClick={() => handlePaymentMethodChange('BANK_TRANSFER')}
              disabled={isProcessing}
            >
              Bank Transfer
            </Button>
          </div>
        </div>

        {/* Tendered Amount Input */}
        {paymentMethod === 'CASH' && (
          <div className="px-6 pb-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Amount Received
              </label>
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={tenderedAmount}
                onChange={(e) => setTenderedAmount(e.target.value)}
                disabled={isProcessing}
                className="w-full px-4 py-3 text-2xl font-bold text-center rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Quick Select Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {quickAmounts.map((amount: number) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(amount)}
                  disabled={isProcessing}
                  className="font-semibold"
                >
                  Rs. {amount}
                </Button>
              ))}
            </div>

            {/* Change Display */}
            <div className="text-center p-4 rounded-xl bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-1">Change Due</p>
              <p
                className={`text-3xl font-bold ${
                  changeDue < 0
                    ? 'text-destructive'
                    : changeDue > 0
                      ? 'text-green-600 dark:text-green-500'
                      : 'text-foreground'
                }`}
              >
                Rs. {(Math.abs(changeDue) / 100).toFixed(2)}
                {changeDue < 0 && ' (Insufficient)'}
              </p>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="p-6 pt-4 border-t border-border flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={handleComplete}
            disabled={!canComplete || isProcessing}
            className="flex-1 font-bold"
          >
            {isProcessing ? 'Processing...' : 'Complete Sale'}
          </Button>
        </div>
      </div>
    </div>
  );
}
